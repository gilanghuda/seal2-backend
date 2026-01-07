import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class LeaveValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = {
    createLeaveRequest: schema.create({
      startDate: schema.date({}, [
        rules.after('today'),
      ]),
      endDate: schema.date({}, [
        rules.afterField('startDate'),
      ]),
      reason: schema.string({ trim: true }, [
        rules.minLength(10),
        rules.maxLength(500),
      ]),
      attachment: schema.file.optional({
        size: '5mb',
        extnames: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
      }),
    }),
    updateLeaveStatus: schema.create({
      status: schema.enum(['approved', 'rejected']),
    }),
  }

  public async validateCreateLeaveRequest() {
    return await this.ctx.request.validate({ schema: this.schema.createLeaveRequest })
  }

  public async validateUpdateLeaveStatus() {
    return await this.ctx.request.validate({ schema: this.schema.updateLeaveStatus })
  }
}
