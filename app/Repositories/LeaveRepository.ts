import LeaveRequest from 'App/Models/LeaveRequest'
import LeaveQuota from 'App/Models/LeaveQuota'
import type { CreateLeaveRequestDTO } from 'App/DTO/LeaveDTO'
import { DateTime } from 'luxon'

export default class LeaveRepository {
    
  public async createLeaveRequest(
    userId: string,
    payload: CreateLeaveRequestDTO
  ): Promise<LeaveRequest> {
    return await LeaveRequest.create({
      userId,
      startDate: DateTime.fromISO(payload.startDate).toJSDate(),
      endDate: DateTime.fromISO(payload.endDate).toJSDate(),
      reason: payload.reason,
      attachment: payload.attachment || null,
      status: 'pending',
    })
  }


  public async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    return await LeaveRequest.query().where('user_id', userId).orderBy('created_at', 'desc')
  }


  public async getAllLeaveRequests(
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: LeaveRequest[]; pagination: { total: number; pages: number } }> {
    const query = LeaveRequest.query()
    const total = await query.count('* as count').then((result) => result[0].$extras.count)
    const data = await LeaveRequest.query()
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
    
    return {
      data: data.all(),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }


  public async getLeaveRequestById(id: string): Promise<LeaveRequest | null> {
    return await LeaveRequest.find(id)
  }


  public async updateLeaveRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<LeaveRequest | null> {
    const leaveRequest = await LeaveRequest.find(id)
    if (leaveRequest) {
      leaveRequest.status = status
      await leaveRequest.save()
      
      
      if (status === 'approved') {
        await this.updateQuotaUsed(leaveRequest.userId, leaveRequest.startDate, leaveRequest.endDate)
      }
    }
    return leaveRequest
  }


  public async getLeaveQuota(userId: string, year: number): Promise<LeaveQuota | null> {
    return await LeaveQuota.query()
      .where('user_id', userId)
      .where('year', year)
      .first()
  }

 
  public async createLeaveQuota(userId: string, year: number): Promise<LeaveQuota> {
    return await LeaveQuota.create({
      userId,
      year,
      quotaTotal: 12,
      quotaUsed: 0,
    })
  }


  private async updateQuotaUsed(userId: string, startDate: Date, endDate: Date): Promise<void> {
    const start = DateTime.fromJSDate(startDate)
    const end = DateTime.fromJSDate(endDate)
    const daysUsed = Math.ceil(end.diff(start, 'days').days) + 1

    const year = start.year
    let quota = await this.getLeaveQuota(userId, year)

    if (!quota) {
      quota = await this.createLeaveQuota(userId, year)
    }

    quota.quotaUsed += daysUsed
    await quota.save()
  }


  public async hasEnoughQuota(userId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const start = DateTime.fromJSDate(startDate)
    const daysNeeded = Math.ceil(DateTime.fromJSDate(endDate).diff(start, 'days').days) + 1

    const quota = await this.getLeaveQuota(userId, start.year)
    if (!quota) {
      return daysNeeded <= 12 
    }

    return quota.quotaUsed + daysNeeded <= quota.quotaTotal
  }


  public async hasLeaveOverlap(userId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const overlapping = await LeaveRequest.query()
      .where('user_id', userId)
      .where('status', 'approved')
      .where((query) => {
        query.where((q) => {
          q.where('start_date', '<=', startDate).andWhere('end_date', '>=', startDate)
        }).orWhere((q) => {
          q.where('start_date', '<=', endDate).andWhere('end_date', '>=', endDate)
        })
      })
      .first()

    return !!overlapping
  }
}
