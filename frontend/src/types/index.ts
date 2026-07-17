export interface UserSummary {
  id: string
  email: string
  username: string
  roles: string[]
  virtualBalance?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserSummary
}

export interface UserProfile {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  phone?: string
  isEmailVerified: boolean
  isBlocked: boolean
  blockedUntil?: string
  blockReason?: string
  roles: string[]
  virtualBalance: number
  createdAt: string
}

export interface AdminUser {
  id: string
  email: string
  username: string
  isActive: boolean
  isBlocked: boolean
  blockedUntil?: string
  blockReason?: string
  isEmailVerified: boolean
  virtualBalance: number
  roles: string[]
  listingsCount: number
  lastLoginAt?: string
  createdAt: string
}

export interface PublicUserProfile {
  id: string
  username: string
  avatarUrl?: string
  bio?: string
  averageRating?: number
  totalReviews: number
  activeListingsCount: number
  memberSince: string
}

export interface CategoryTree {
  id: string
  name: string
  slug: string
  iconUrl?: string
  sortOrder: number
  children: CategoryTree[]
}

export interface ListingCard {
  id: string
  title: string
  slug: string
  price: number
  currency: string
  stockQuantity: number
  status: string
  primaryImageUrl?: string
  categoryName: string
  sellerUsername: string
  sellerRating?: number
  createdAt: string
  isFeatured: boolean
}

export interface ListingImage {
  id: string
  url: string
  altText?: string
  sortOrder: number
  isPrimary: boolean
}

export interface ListingDetail {
  id: string
  title: string
  slug: string
  description: string
  price: number
  currency: string
  stockQuantity: number
  status: string
  deliveryInfo?: string
  viewCount: number
  isFeatured: boolean
  createdAt: string
  publishedAt?: string
  categoryId: string
  categoryName: string
  sellerId: string
  sellerUsername: string
  sellerRating?: number
  images: ListingImage[]
  attributes: { name: string; slug: string; value: string }[]
  tags: string[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiProblem {
  title?: string
  detail?: string
  status?: number
}

export interface Wallet {
  balance: number
  currency: string
}

export interface Order {
  id: string
  orderNumber: string
  listingId: string
  quantity: number
  amount: number
  currency: string
  status: string
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  senderUsername: string
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  listingId?: string
  orderId?: string
  participants: { userId: string; username: string }[]
  messages: Message[]
}

export interface SellerReview {
  id: string
  reviewerUsername: string
  rating: number
  comment?: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  body?: string
  dataJson?: string
  isRead: boolean
  createdAt: string
}

export interface NotificationsResult {
  items: NotificationItem[]
  unreadCount: number
}

export interface ProfilePost {
  id: string
  content: string
  createdAt: string
}
