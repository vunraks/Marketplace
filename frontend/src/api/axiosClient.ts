import axios from 'axios'
import { storage } from '../utils/storage'
import type { AuthResponse } from '../types'
import { apiBaseUrl } from '../config/api'

const baseURL = apiBaseUrl

export const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = storage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<(token: string | null) => void> = []

const processQueue = (token: string | null) => {
  queue.forEach((cb) => cb(token))
  queue = []
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) throw error

    const refreshToken = storage.getRefreshToken()
    if (!refreshToken) {
      storage.clearAuth()
      throw error
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) return reject(error)
          original.headers.Authorization = `Bearer ${token}`
          resolve(axiosClient(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<AuthResponse>(`${baseURL}/auth/refresh`, { refreshToken })
      storage.setAuth(data.accessToken, data.refreshToken, data.user)
      processQueue(data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return axiosClient(original)
    } catch {
      storage.clearAuth()
      processQueue(null)
      throw error
    } finally {
      isRefreshing = false
    }
  },
)
