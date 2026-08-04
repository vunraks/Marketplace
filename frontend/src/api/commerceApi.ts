import { axiosClient } from './axiosClient'
import type {
  Conversation,
  Dispute,
  FavoriteState,
  ListingCard,
  NotificationsResult,
  Order,
  SellerDashboard,
  SellerReview,
  Wallet,
} from '../types'

export const commerceApi = {
  getWallet: () => axiosClient.get<Wallet>('/wallet'),
  topUpWallet: (amount: number) => axiosClient.post<Wallet>('/wallet/top-up', { amount }),
  withdrawWallet: (amount: number) => axiosClient.post<Wallet>('/wallet/withdraw', { amount }),
  createOrder: (listingId: string, quantity: number, buyerNote?: string) =>
    axiosClient.post<Order>('/orders', { listingId, quantity, buyerNote }),
  confirmOrder: (orderId: string) => axiosClient.post<Order>(`/orders/${orderId}/confirm`),
  getConversations: () => axiosClient.get<Conversation[]>('/conversations'),
  getConversationForListing: (listingId: string) =>
    axiosClient.get<Conversation>(`/conversations/listings/${listingId}`),
  sendListingMessage: (listingId: string, content: string) =>
    axiosClient.post<Conversation>(`/conversations/listings/${listingId}/messages`, { content }),
  getSellerReviews: (sellerId: string) =>
    axiosClient.get<SellerReview[]>(`/reviews/sellers/${sellerId}`),
  createReview: (orderId: string, rating: number, comment?: string) =>
    axiosClient.post(`/reviews/orders/${orderId}`, { rating, comment }),
  getNotifications: () => axiosClient.get<NotificationsResult>('/notifications'),
  markNotificationsRead: () => axiosClient.post('/notifications/mark-read'),
  getFavorites: () => axiosClient.get<ListingCard[]>('/favorites'),
  getFavoriteState: (listingId: string) => axiosClient.get<FavoriteState>(`/favorites/${listingId}`),
  addFavorite: (listingId: string) => axiosClient.post(`/favorites/${listingId}`),
  removeFavorite: (listingId: string) => axiosClient.delete(`/favorites/${listingId}`),
  getSellerDashboard: () => axiosClient.get<SellerDashboard>('/seller/dashboard'),
  getMyDisputes: () => axiosClient.get<Dispute[]>('/disputes/mine'),
  getAdminDisputes: () => axiosClient.get<Dispute[]>('/disputes/admin'),
  createDispute: (orderId: string, reason: string, description?: string) =>
    axiosClient.post<Dispute>('/disputes', { orderId, reason, description }),
  resolveDispute: (id: string, resolution: 'refund' | 'complete' | 'reject', note?: string) =>
    axiosClient.put<Dispute>(`/disputes/${id}/resolve`, { resolution, note }),
}
