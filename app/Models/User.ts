import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import { column, beforeSave, BaseModel, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import UserProvider from 'App/Models/UserProvider'
import LeaveRequest from 'App/Models/LeaveRequest'
import LeaveQuota from 'App/Models/LeaveQuota'

export default class User extends BaseModel {
  public static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  public id: string

  @column()
  public email: string

  @column()
  public username: string

  @column({ serializeAs: null })
  public password: string | null

  @column()
  public avatarUrl: string | null

  @column()
  public role: 'user' | 'admin'

  @hasMany(() => UserProvider)
  public providers: HasMany<typeof UserProvider>

  @hasMany(() => LeaveRequest)
  public leaveRequests: HasMany<typeof LeaveRequest>

  @hasMany(() => LeaveQuota)
  public leaveQuotas: HasMany<typeof LeaveQuota>

  @column()
  public rememberMeToken: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword (user: User) {
    if (user.$dirty.password && user.password) {
      user.password = await Hash.make(user.password)
    }
  }
}
