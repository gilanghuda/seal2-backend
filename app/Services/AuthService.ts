import User from 'App/Models/User'
import UserRepository from 'App/Repositories/UserRepository'
import type { RegisterRequestDTO, LoginRequestDTO, AuthResponseDTO, OAuthUserDTO, UserDTO } from 'App/DTO/AuthDTO'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class AuthService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  public async register(payload: RegisterRequestDTO): Promise<User> {
    const emailExists = await this.userRepository.emailExists(payload.email)
    if (emailExists) {
      const err = new Error('Email already exists')
      ;(err as any).code = 'E_EMAIL_EXISTS'
      throw err
    }

  
    const usernameExists = await this.userRepository.usernameExists(payload.username)
    if (usernameExists) {
      const err = new Error('Username already exists')
      ;(err as any).code = 'E_USERNAME_EXISTS'
      throw err
    }

    return await this.userRepository.create(payload)
  }

  public async login(ctx: HttpContextContract, payload: LoginRequestDTO): Promise<AuthResponseDTO> {
    try {
      await ctx.auth.use('web').attempt(payload.email, payload.password, true)

      const user = await this.userRepository.findByEmail(payload.email) || ctx.auth.use('web').user
      if (!user) {
        const err = new Error('User not found')
        ;(err as any).code = 'E_USER_NOT_FOUND'
        throw err
      }

      return {
        user: this.serializeUser(user),
        token: "",
      }
    } catch (error) {
      const code = (error as any).code
      if (code === 'E_INVALID_AUTH_PASSWORD' || code === 'E_INVALID_AUTH_UID') {
        const err = new Error('Invalid credentials')
        ;(err as any).code = 'E_INVALID_CREDENTIALS'
        throw err
      }
      throw error
    }
  }

  public async oauthLogin(ctx: HttpContextContract, oauthPayload: OAuthUserDTO): Promise<AuthResponseDTO> {
    try {
      const user = await this.userRepository.createOrUpdateOAuthUser(oauthPayload)

      if (!user) {
        const err = new Error('User not found')
        ;(err as any).code = 'E_USER_NOT_FOUND'
        throw err
      }
      await ctx.auth.use('web').login(user, true)

      return {
        user: this.serializeUser(user),
        token: "",
      }
    } catch (error) {
      const err = new Error((error as any)?.message || 'OAuth failed')
      ;(err as any).code = 'E_OAUTH_FAILED'
      throw err
    }
  }

  public async logout(ctx: HttpContextContract): Promise<void> {
    try {
      await ctx.auth.use('web').logout()
    } catch (error) {
      if ((error as any).code !== 'E_RUNTIME_ERROR') {
        throw error
      }
    }
  }

  public async getCurrentUser(user: User | null): Promise<UserDTO> {
    if (!user) {
      const err = new Error('Not authenticated')
      ;(err as any).code = 'E_NOT_AUTHENTICATED'
      throw err
    }

    return this.serializeUser(user)
  }

  private serializeUser(user: User): UserDTO {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl || undefined,
      createdAt: user.createdAt?.toISO() || '',
      updatedAt: user.updatedAt?.toISO() || '',
    }
  }
}
