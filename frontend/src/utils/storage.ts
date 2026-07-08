import type { UserSummary } from '../types'

const ACCESS_KEY = 'vt_access_token'
const REFRESH_KEY = 'vt_refresh_token'
const USER_KEY = 'vt_user'

export const storage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: (): UserSummary | null => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserSummary) : null
  },
  setAuth: (accessToken: string, refreshToken: string, user: UserSummary) => {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearAuth: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
