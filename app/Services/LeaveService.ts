import LeaveRepository from 'App/Repositories/LeaveRepository'
import FileSystemHelper from 'App/Utils/FileSystem'
import type { CreateLeaveRequestDTO, LeaveRequestDTO, LeaveQuotaDTO } from 'App/DTO/LeaveDTO'
import { DateTime } from 'luxon'


export default class LeaveService {
  private leaveRepository: LeaveRepository

  constructor() {
    this.leaveRepository = new LeaveRepository()
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
