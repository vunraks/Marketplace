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

export const authApi = {
  register: (payload: RegisterPayload) =>
    axiosClient.post<{ userId: string; email: string; username: string; message: string }>(
      '/auth/register',
      payload,
    ),
  login: (payload: LoginPayload) => axiosClient.post<AuthResponse>('/auth/login', payload),
  externalLogin: (provider: 'google', payload: ExternalLoginPayload) =>
    axiosClient.post<AuthResponse>(`/auth/external/${provider}`, payload),
  externalLoginUrl: (provider: 'google' | 'steam') => `${authBaseUrl}/auth/external/${provider}`,
  logout: (refreshToken: string) => axiosClient.post('/auth/logout', { refreshToken }),
}
