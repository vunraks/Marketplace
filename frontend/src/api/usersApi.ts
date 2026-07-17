import { axiosClient } from './axiosClient'
import type { AdminUser, ProfilePost, PublicUserProfile, UserProfile } from '../types'

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  bio?: string
  phone?: string
}

export const usersApi = {
  getMe: () => axiosClient.get<UserProfile>('/users/me'),
  updateMe: (payload: UpdateProfilePayload) => axiosClient.put<UserProfile>('/users/me', payload),
  becomeSeller: () => axiosClient.post<{ message: string }>('/users/me/become-seller'),
  getPublic: (username: string) => axiosClient.get<PublicUserProfile>(`/users/${username}`),
  getMyPosts: () => axiosClient.get<ProfilePost[]>('/profile-posts/me'),
  createMyPost: (content: string) => axiosClient.post<ProfilePost>('/profile-posts/me', { content }),
  getAdminUsers: () => axiosClient.get<AdminUser[]>('/users/admin'),
  updateAdminUserRoles: (id: string, roles: string[]) =>
    axiosClient.put<AdminUser>(`/users/admin/${id}/roles`, { roles }),
  adjustAdminUserBalance: (id: string, amount: number) =>
    axiosClient.post<AdminUser>(`/users/admin/${id}/balance`, { amount }),
  updateAdminUserBlock: (id: string, payload: { isBlocked: boolean; blockedUntil?: string | null; reason?: string }) =>
    axiosClient.put<AdminUser>(`/users/admin/${id}/block`, payload),
}
