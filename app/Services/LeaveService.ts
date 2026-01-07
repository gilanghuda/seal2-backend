import LeaveRepository from 'App/Repositories/LeaveRepository'
import EncryptionService from 'App/Utils/EncryptionService'
import FileSystemHelper from 'App/Utils/FileSystem'
import type { CreateLeaveRequestDTO, LeaveRequestDTO, LeaveQuotaDTO } from 'App/DTO/LeaveDTO'
import { DateTime } from 'luxon'


export default class LeaveService {
  private leaveRepository: LeaveRepository
  private encryptionService: EncryptionService

  constructor() {
    this.leaveRepository = new LeaveRepository()
    this.encryptionService = new EncryptionService()
  }


  public async createLeaveRequest(
    userId: string,
    payload: CreateLeaveRequestDTO
  ): Promise<LeaveRequestDTO> {
    const hasOverlap = await this.leaveRepository.hasLeaveOverlap(
      userId,
      new Date(payload.startDate),
      new Date(payload.endDate)
    )
    if (hasOverlap) {
      const err = new Error('Tanggal cuti sudah ada yang tumpang tindih dengan cuti sebelumnya')
      ;(err as any).code = 'E_LEAVE_OVERLAP'
      throw err
    }

    const hasQuota = await this.leaveRepository.hasEnoughQuota(
      userId,
      new Date(payload.startDate),
      new Date(payload.endDate)
    )
    if (!hasQuota) {
      const err = new Error('Kuota cuti tidak cukup untuk periode ini')
      ;(err as any).code = 'E_INSUFFICIENT_QUOTA'
      throw err
    }

    let attachmentPath: string | null = null
    if (payload.attachment) {
      const fileName = FileSystemHelper.generateFileName(payload.attachment.clientName)
      await payload.attachment.moveToDisk('./leave_attachments', { name: fileName }, 'local')
      attachmentPath = `leave_attachments/${fileName}`
    }

    const leaveRequestPayload = {
      startDate: payload.startDate,
      endDate: payload.endDate,
      reason: payload.reason,
      attachment: attachmentPath,
    }

    const leaveRequest = await this.leaveRepository.createLeaveRequest(userId, leaveRequestPayload)
    return this.serializeLeaveRequest(leaveRequest)
  }


  public async getMyLeaveRequests(userId: string): Promise<LeaveRequestDTO[]> {
    const requests = await this.leaveRepository.getUserLeaveRequests(userId)
    return requests.map((req) => this.serializeLeaveRequest(req))
  }


  public async getAllLeaveRequests(page: number = 1, limit: number = 10) {
    const result = await this.leaveRepository.getAllLeaveRequests(page, limit)
    return {
      data: result.data.map((req) => this.serializeLeaveRequest(req)),
      pagination: result.pagination,
    }
  }


  public async getLeaveRequestById(id: string): Promise<LeaveRequestDTO | null> {
    const leaveRequest = await this.leaveRepository.getLeaveRequestById(id)
    if (!leaveRequest) return null
    return this.serializeLeaveRequest(leaveRequest)
  }

  public async updateLeaveRequestStatus(
    id: string,
    status: 'approved' | 'rejected'
  ): Promise<LeaveRequestDTO | null> {
    const leaveRequest = await this.leaveRepository.updateLeaveRequestStatus(id, status)
    if (!leaveRequest) return null
    return this.serializeLeaveRequest(leaveRequest)
  }


  public async getMyLeaveQuota(userId: string): Promise<LeaveQuotaDTO> {
    const currentYear = DateTime.now().year
    let quota = await this.leaveRepository.getLeaveQuota(userId, currentYear)

    if (!quota) {
      quota = await this.leaveRepository.createLeaveQuota(userId, currentYear)
    }

    return {
      year: quota.year,
      quotaTotal: quota.quotaTotal,
      quotaUsed: quota.quotaUsed,
      quotaRemaining: quota.quotaTotal - quota.quotaUsed,
    }
  }

  /**
   * Safe Delete (Soft Delete) dengan Encoding
   */
  public async softDeleteLeaveRequest(id: string): Promise<{ message: string }> {
    const leaveRequest = await this.leaveRepository.softDeleteLeaveRequest(
      id,
      this.encryptionService
    )

    if (!leaveRequest) {
      const err = new Error('Pengajuan cuti tidak ditemukan')
      ;(err as any).code = 'E_NOT_FOUND'
      throw err
    }

    return {
      message: 'Pengajuan cuti berhasil dihapus (data terenkripsi)',
    }
  }

  /**
   * Restore (Decode) data yang sudah di-delete
   */
  public async restoreLeaveRequest(id: string): Promise<LeaveRequestDTO | null> {
    const leaveRequest = await this.leaveRepository.restoreLeaveRequest(
      id,
      this.encryptionService
    )

    if (!leaveRequest) {
      const err = new Error('Pengajuan cuti yang dihapus tidak ditemukan')
      ;(err as any).code = 'E_NOT_FOUND'
      throw err
    }

    return this.serializeLeaveRequest(leaveRequest)
  }

  /**
   * Dapatkan daftar leave request yang sudah dihapus (Admin only)
   */
  public async getDeletedLeaveRequests(page: number = 1, limit: number = 10) {
    const result = await this.leaveRepository.getDeletedLeaveRequests(page, limit)
    return {
      data: result.data.map((req) => ({
        id: req.id,
        userId: req.userId,
        status: req.status,
        deletedAt: req.deletedAt?.toISO() || '',
        note: 'Data terenkripsi. Gunakan restore endpoint untuk mengembalikan data.',
      })),
      pagination: result.pagination,
    }
  }

  private serializeLeaveRequest(leaveRequest: any): LeaveRequestDTO {
    return {
      id: leaveRequest.id,
      userId: leaveRequest.userId,
      startDate: DateTime.fromJSDate(leaveRequest.startDate).toISODate() ?? '',
      endDate: DateTime.fromJSDate(leaveRequest.endDate).toISODate() ?? '',
      reason: leaveRequest.reason,
      attachment: leaveRequest.attachment,
      status: leaveRequest.status,
      createdAt: leaveRequest.createdAt?.toISO() || '',
      updatedAt: leaveRequest.updatedAt?.toISO() || '',
    }
  }
}
