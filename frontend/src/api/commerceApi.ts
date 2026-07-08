import { axiosClient } from './axiosClient'
import type { Conversation, NotificationsResult, Order, SellerReview, Wallet } from '../types'

export const commerceApi = {
  getWallet: () => axiosClient.get<Wallet>('/wallet'),
  topUpWallet: (amount: number) => axiosClient.post<Wallet>('/wallet/top-up', { amount }),
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
}
