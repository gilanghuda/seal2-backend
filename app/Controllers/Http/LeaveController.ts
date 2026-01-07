import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import LeaveService from 'App/Services/LeaveService'
import LeaveValidator from 'App/Validators/LeaveValidator'
import ResponseBuilder from 'App/Utils/ResponseBuilder'

export default class LeaveController {
  private leaveService: LeaveService

  constructor() {
    this.leaveService = new LeaveService()
  }

  public async create({ auth, request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)
    const user = auth.use('web').user

    if (!user) {
      return responseService.unauthorized('Not authenticated')
    }

    try {
      const validator = new LeaveValidator({ request, response } as HttpContextContract)
      const payload = await validator.validateCreateLeaveRequest()

      const leaveRequest = await this.leaveService.createLeaveRequest(user.id, {
        ...payload,
        startDate: payload.startDate.toISODate()!,
        endDate: payload.endDate.toISODate()!,
      })
      return responseService.created('Pengajuan cuti berhasil dibuat', leaveRequest)
    } catch (error) {
      const err = error as any

      if (error.messages) {
        return responseService.badRequest('Validasi gagal', err.messages)
      }

      if (error.code === 'E_LEAVE_OVERLAP') {
        return responseService.conflict(error.message)
      }

      if (error.code === 'E_INSUFFICIENT_QUOTA') {
        return responseService.forbidden(error.message)
      }

      return responseService.internalServerError(err?.message || 'Gagal membuat pengajuan cuti')
    }
  }


  public async index({ auth, request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)
    const user = auth.use('web').user

    if (!user) {
      return responseService.unauthorized('Not authenticated')
    }

    try {
      const leaveRequests = await this.leaveService.getMyLeaveRequests(user.id)
      return responseService.ok('Pengajuan cuti berhasil diambil', leaveRequests)
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(err?.message || 'Gagal mengambil pengajuan cuti')
    }
  }


  public async getMyQuota({ auth, request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)
    const user = auth.use('web').user

    if (!user) {
      return responseService.unauthorized('Not authenticated')
    }

    try {
      const quota = await this.leaveService.getMyLeaveQuota(user.id)
      return responseService.ok('Kuota cuti berhasil diambil', quota)
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(err?.message || 'Gagal mengambil kuota cuti')
    }
  }

 
  public async show({ params, auth, request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)
    const user = auth.use('web').user

    if (!user) {
      return responseService.unauthorized('Not authenticated')
    }

    try {
      const leaveRequest = await this.leaveService.getLeaveRequestById(params.id)

      if (!leaveRequest) {
        return responseService.notFound('Pengajuan cuti tidak ditemukan')
      }

    
      if (user.role === 'user' && leaveRequest.userId !== user.id) {
        return responseService.forbidden('Anda tidak memiliki akses ke pengajuan cuti ini')
      }

      return responseService.ok('Detail pengajuan cuti berhasil diambil', leaveRequest)
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(err?.message || 'Gagal mengambil detail pengajuan cuti')
    }
  }


  public async updateStatus({ params, auth, request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)
    const user = auth.use('web').user

    if (!user) {
      return responseService.unauthorized('Not authenticated')
    }

    if (user.role !== 'admin') {
      return responseService.forbidden('Hanya admin yang dapat mengubah status pengajuan cuti')
    }

    try {
      const validator = new LeaveValidator({ request, response } as HttpContextContract)
      const payload = await validator.validateUpdateLeaveStatus()

      const leaveRequest = await this.leaveService.updateLeaveRequestStatus(params.id, payload.status as 'approved' | 'rejected')

      if (!leaveRequest) {
        return responseService.notFound('Pengajuan cuti tidak ditemukan')
      }

      return responseService.ok('Status pengajuan cuti berhasil diperbarui', leaveRequest)
    } catch (error) {
      const err = error as any

      if (error.messages) {
        return responseService.badRequest('Validasi gagal', err.messages)
      }

      return responseService.internalServerError(
        err?.message || 'Gagal memperbarui status pengajuan cuti'
      )
    }
  }


  public async getAllRequests({ auth, request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)
    const user = auth.use('web').user

    if (!user) {
      return responseService.unauthorized('Not authenticated')
    }

    if (user.role !== 'admin') {
      return responseService.forbidden('Hanya admin yang dapat melihat semua pengajuan cuti')
    }

    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)

      const result = await this.leaveService.getAllLeaveRequests(page, limit)
      return responseService.ok('Semua pengajuan cuti berhasil diambil', result)
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(
        err?.message || 'Gagal mengambil semua pengajuan cuti'
      )
    }
  }


public async delete({ params, auth, request, response }: HttpContextContract) {
  const responseService = new ResponseBuilder(response, request)
  const user = auth.use('web').user

  if (!user) {
    return responseService.unauthorized('Not authenticated')
  }

  try {
    const leaveRequest = await this.leaveService.getLeaveRequestById(params.id)

    if (!leaveRequest) {
      return responseService.notFound('Pengajuan cuti tidak ditemukan')
    }


    if (user.role === 'user' && leaveRequest.userId !== user.id) {
      return responseService.forbidden('Anda tidak memiliki akses untuk menghapus pengajuan cuti ini')
    }

    const result = await this.leaveService.softDeleteLeaveRequest(params.id)
    return responseService.ok(result.message)
  } catch (error) {
    const err = error as any
    return responseService.internalServerError(err?.message || 'Gagal menghapus pengajuan cuti')
  }
}


public async restore({ params, auth, request, response }: HttpContextContract) {
  const responseService = new ResponseBuilder(response, request)
  const user = auth.use('web').user

  if (!user) {
    return responseService.unauthorized('Not authenticated')
  }

  if (user.role !== 'admin') {
    return responseService.forbidden('Hanya admin yang dapat restore pengajuan cuti')
  }

  try {
    const leaveRequest = await this.leaveService.restoreLeaveRequest(params.id)

    if (!leaveRequest) {
      return responseService.notFound('Pengajuan cuti yang dihapus tidak ditemukan')
    }

    return responseService.ok('Pengajuan cuti berhasil dikembalikan (data didekripsi)', leaveRequest)
  } catch (error) {
    const err = error as any
    if (error.code === 'E_DECRYPTION_FAILED') {
      return responseService.badRequest('Data terenkripsi tidak valid, tidak dapat dikembalikan', error.messages)
    }
    return responseService.internalServerError(err?.message || 'Gagal mengembalikan pengajuan cuti')
  }
}


public async getDeletedRequests({ auth, request, response }: HttpContextContract) {
  const responseService = new ResponseBuilder(response, request)
  const user = auth.use('web').user

  if (!user) {
    return responseService.unauthorized('Not authenticated')
  }

  if (user.role !== 'admin') {
    return responseService.forbidden('Hanya admin yang dapat melihat pengajuan cuti yang dihapus')
  }

  try {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const result = await this.leaveService.getDeletedLeaveRequests(page, limit)
    return responseService.ok('Daftar pengajuan cuti yang dihapus berhasil diambil', result)
  } catch (error) {
    const err = error as any
    return responseService.internalServerError(err?.message || 'Gagal mengambil daftar pengajuan cuti yang dihapus')
  }
}
}
