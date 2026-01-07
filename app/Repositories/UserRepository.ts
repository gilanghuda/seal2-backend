import User from 'App/Models/User'
import UserProvider from 'App/Models/UserProvider'
import type { RegisterRequestDTO, OAuthUserDTO } from 'App/DTO/AuthDTO'

export default class UserRepository {
  public async create(payload: RegisterRequestDTO): Promise<User> {
    return await User.create({
      username: payload.username,
      email: payload.email,
      password: payload.password,
    })
  }

  public async createOrUpdateOAuthUser(payload: OAuthUserDTO): Promise<User> {
    const providerRecord = await UserProvider.query()
      .where('provider', payload.provider)
      .where('provider_id', payload.providerId)
      .first()

    if (providerRecord) {
      const user = await providerRecord.related('user').query().first()
      if (user) {
        providerRecord.avatarUrl = payload.avatarUrl || providerRecord.avatarUrl
        providerRecord.providerData = payload.raw || providerRecord.providerData
        await providerRecord.save()
        return user
      }
    }


    let user = await User.findBy('email', payload.email)
    if (user) {
    
      await UserProvider.create({
        userId: user.id,
        provider: payload.provider,
        providerId: payload.providerId,
        providerData: payload.raw || null,
        avatarUrl: payload.avatarUrl || null,
      })
      if (!user.avatarUrl && payload.avatarUrl) {
        user.avatarUrl = payload.avatarUrl
        await user.save()
      }
      return user
    }

    user = await User.create({
      username: payload.username || payload.email.split('@')[0],
      email: payload.email,
      password: null,
      avatarUrl: payload.avatarUrl || null,
    })

    await UserProvider.create({
      userId: user.id,
      provider: payload.provider,
      providerId: payload.providerId,
      providerData: payload.raw || null,
      avatarUrl: payload.avatarUrl || null,
    })

    return user
  }

  public async findByEmail(email: string): Promise<User | null> {
    return await User.findBy('email', email)
  }

  public async findById(id: string): Promise<User | null> {
    return await User.find(id)
  }

  public async findByProvider(provider: string, providerId: string): Promise<User | null> {
    const providerRecord = await UserProvider.query()
      .where('provider', provider)
      .where('provider_id', providerId)
      .first()

    if (!providerRecord) return null
    const user = await providerRecord.related('user').query().first()
    return user || null
  }

  public async emailExists(email: string): Promise<boolean> {
    return !!(await User.findBy('email', email))
  }

  public async usernameExists(username: string): Promise<boolean> {
    return !!(await User.findBy('username', username))
  }
}
