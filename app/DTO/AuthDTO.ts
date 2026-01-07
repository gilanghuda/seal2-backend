export interface RegisterRequestDTO {
  username: string
  email: string
  password: string
}

export interface LoginRequestDTO {
  email: string
  password: string
}

export interface OAuthUserDTO {
  email: string
  username?: string
  avatarUrl?: string
  provider: string
  providerId: string
  token?: string | null
  refreshToken?: string | null
  raw?: any | null
}

export interface AuthResponseDTO {
  user: UserDTO
  token: string
}

export interface UserDTO {
  id: string
  username: string
  email: string
  avatarUrl?: string
  provider?: string
  createdAt: string
  updatedAt: string
}

export interface TokenDTO {
  type: string
  token: string
  expiresIn?: string
}
