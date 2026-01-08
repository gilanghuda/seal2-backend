import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'

export default class UserProvider extends BaseModel {
  public static table = 'user_providers'

  @column({ isPrimary: true })
  public id: number

  @column()
  public userId: string

  @column()
  public provider: string

  @column({ columnName: 'provider_id' })
  public providerId: string

  @column({ columnName: 'provider_data' })
  public providerData: any | null

  @column({ columnName: 'avatar_url' })
  public avatarUrl: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>
}
