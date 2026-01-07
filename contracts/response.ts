export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
  meta: {
    timestamp: string
    requestId: string
  }
}
