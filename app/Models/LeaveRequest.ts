import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo, scope } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'

export default class LeaveRequest extends BaseModel {
  public static table = 'leave_requests'

  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'user_id' })
  public userId: string

  @column()
  public startDate: Date

  @column()
  public endDate: Date

  @column()
  public reason: string

  @column()
  public attachment: string | null

  @column()
  public status: 'pending' | 'approved' | 'rejected'

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column.dateTime({ columnName: 'deleted_at' })
  public deletedAt: DateTime | null

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  public static onlyActive = scope((query) => {
    query.whereNull('deleted_at')
  })


  public static onlyTrashed = scope((query) => {
    query.whereNotNull('deleted_at')
  })



}
