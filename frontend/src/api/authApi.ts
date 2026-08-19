import { axiosClient } from './axiosClient'
import type { AuthResponse } from '../types'

const authBaseUrl = axiosClient.defaults.baseURL ?? '/api/v1'

export interface RegisterPayload {
  email: string
  username: string
  password: string
  confirmPassword: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ExternalLoginPayload {
  idToken: string
}

export interface TelegramLoginPayload {
  id: number
  firstName?: string
  lastName?: string
  username?: string
  photoUrl?: string
  authDate: number
  hash: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
  confirmPassword: string
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    axiosClient.post<{ userId: string; email: string; username: string; message: string }>(
      '/auth/register',
      payload,
    ),
  login: (payload: LoginPayload) => axiosClient.post<AuthResponse>('/auth/login', payload),
  externalLogin: (provider: 'google', payload: ExternalLoginPayload) =>
    axiosClient.post<AuthResponse>(`/auth/external/${provider}`, payload),
  telegramLogin: (payload: TelegramLoginPayload) =>
    axiosClient.post<AuthResponse>('/auth/external/telegram', payload),
  externalLoginUrl: (provider: 'google' | 'steam') => `${authBaseUrl}/auth/external/${provider}`,
  forgotPassword: (payload: ForgotPasswordPayload) => axiosClient.post('/auth/forgot-password', payload),
  resetPassword: (payload: ResetPasswordPayload) => axiosClient.post('/auth/reset-password', payload),
  logout: (refreshToken: string) => axiosClient.post('/auth/logout', { refreshToken }),
}
