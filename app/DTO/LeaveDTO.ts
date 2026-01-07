export interface CreateLeaveRequestDTO {
  startDate: string
  endDate: string
  reason: string
  attachment?: any
}

export interface UpdateLeaveStatusDTO {
  status: 'approved' | 'rejected'
}

export interface LeaveRequestDTO {
  id: string
  userId: string
  startDate: string
  endDate: string
  reason: string
  attachment: string | null
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface LeaveQuotaDTO {
  year: number
  quotaTotal: number
  quotaUsed: number
  quotaRemaining: number
}
