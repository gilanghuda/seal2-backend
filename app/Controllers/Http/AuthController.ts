import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AuthValidator from 'App/Validators/AuthValidator'
import AuthService from 'App/Services/AuthService'
import ResponseBuilder from 'App/Utils/ResponseBuilder'

export default class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }


  public async register({ request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)

    try {
      const validator = new AuthValidator({ request, response } as HttpContextContract)
      const payload = await validator.validateRegister()
      const user = await this.authService.register(payload)

      return responseService.created('User registered successfully', {
        user: user.serialize(),
      })
    } catch (error) {
      console.log(error)
      const err = error as any
      if (error.messages) {
        return responseService.badRequest('Validation failed', err.messages || {})
      }
      if (error.code === 'E_EMAIL_EXISTS') {
        return responseService.conflict(error.message)
      }
      if (error.code === 'E_USERNAME_EXISTS') {
        return responseService.conflict(error.message)
      }
      return responseService.internalServerError(err?.message || 'Registration failed')
    }
  }


  public async login(ctx: HttpContextContract) {
    const { request, response } = ctx
    const responseService = new ResponseBuilder(response, request)

    try {
      const validator = new AuthValidator(ctx)
      const payload = await validator.validateLogin()
      const result = await this.authService.login(ctx, payload)

      return responseService.ok('Login successful', result)
    } catch (error) {
      const err = error as any
      if (error.messages) {
        return responseService.badRequest('Validation failed', err.messages || {})
      }
      if (error.code === 'E_INVALID_CREDENTIALS') {
        return responseService.unauthorized(error.message)
      }
      return responseService.unauthorized(err?.message || 'Invalid email or password')
    }
  }

 
  public async logout(ctx: HttpContextContract) {
    const { request, response } = ctx
    const responseService = new ResponseBuilder(response, request)

    try {
      await this.authService.logout(ctx)
      return responseService.ok('Logout successful')
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(err?.message || 'Logout failed')
    }
  }


  public async me({ auth, request, response }: HttpContextContract) {
    const responseService = new ResponseBuilder(response, request)

    try {
      const user = auth.use('web').user
      const userData = await this.authService.getCurrentUser(user ?? null)
      return responseService.ok('Profile retrieved', userData)
    } catch (error) {
      const err = error as any
      return responseService.unauthorized(err?.message || 'Not authenticated')
    }
  }


  public async redirectToGoogle({ ally }: HttpContextContract) {
    return ally.use('google').redirect()
  }

  public async handleGoogleCallback(ctx: HttpContextContract) {
    const { ally, request, response } = ctx
    const responseService = new ResponseBuilder(response, request)

    try {
      const google = ally.use('google')

      if (google.hasError()) {
        return responseService.unauthorized('Google authentication failed')
      }

      const googleUser = await google.user()

      const result = await this.authService.oauthLogin(ctx, {
        email: googleUser.email!,
        username: googleUser.name?.split(' ')[0] || googleUser.email!.split('@')[0],
        avatarUrl: googleUser.avatarUrl || undefined,
        provider: 'google',
        providerId: googleUser.id,
        raw: googleUser,
      })

      return responseService.ok('Google login successful', result)
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(err?.message || 'Google callback failed')
    }
  }


  public async redirectToGithub({ ally }: HttpContextContract) {
    console.log('Redirecting to GitHub OAuth...')
    console.log(ally)
    console.log(ally.use('github'))
    console.log(ally.use('github').redirect())

    return ally.use('github').redirect()
  }

  public async handleGithubCallback(ctx: HttpContextContract) {
    const { ally, request, response } = ctx
    const responseService = new ResponseBuilder(response, request)

    try {
      const github = ally.use('github')

      if (github.hasError()) {
        return responseService.unauthorized('GitHub authentication failed')
      }

      const githubUser = await github.user()

      const result = await this.authService.oauthLogin(ctx, {
        email: githubUser.email!,
        username: githubUser.name || githubUser.nickName || githubUser.email!.split('@')[0],
        avatarUrl: githubUser.avatarUrl || undefined,
        provider: 'github',
        providerId: githubUser.id,
        raw: githubUser,
      })

      return responseService.ok('GitHub login successful', result)
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(err?.message || 'GitHub callback failed')
    }
  }


  public async redirectToDiscord({ ally }: HttpContextContract) {
    return ally.use('discord').redirect()
  }

  public async handleDiscordCallback(ctx: HttpContextContract) {
    const { ally, request, response } = ctx
    const responseService = new ResponseBuilder(response, request)

    try {
      const discord = ally.use('discord')

      if (discord.hasError()) {
        return responseService.unauthorized('Discord authentication failed')
      }

      const discordUser = await discord.user()

      const result = await this.authService.oauthLogin(ctx, {
        email: discordUser.email!,
        username: discordUser.name || discordUser.email!.split('@')[0],
        avatarUrl: discordUser.avatarUrl || undefined,
        provider: 'discord',
        providerId: discordUser.id,
        raw: discordUser,
      })

      return responseService.ok('Discord login successful', result)
    } catch (error) {
      const err = error as any
      return responseService.internalServerError(err?.message || 'Discord callback failed')
    }
  }
}
