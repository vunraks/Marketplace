import { apiOrigin } from '../config/api'

export const imagePlaceholder = 'https://placehold.co/600x400?text=VaultTrade'
export const defaultListingImage = '/stock-listings/digital-services.svg'

export const stockImageForCategory = (categoryName?: string) => {
  const normalized = (categoryName ?? '').toLowerCase()

  if (normalized.includes('steam')) return '/stock-listings/steam-market.webp'
  if (normalized.includes('epic')) return '/stock-listings/epic-games.webp'
  if (normalized.includes('riot') || normalized.includes('valorant') || normalized.includes('league')) {
    return '/stock-listings/riot-games.webp'
  }
  if (normalized.includes('предмет') || normalized.includes('item') || normalized.includes('скин')) {
    return '/stock-listings/game-items.webp'
  }
  if (normalized.includes('ключ') || normalized.includes('key') || normalized.includes('license')) {
    return '/stock-listings/license-keys.webp'
  }
  if (normalized.includes('подпис') || normalized.includes('subscription')) {
    return '/stock-listings/subscriptions.svg'
  }
  if (normalized.includes('аккаунт') || normalized.includes('account')) {
    return '/stock-listings/game-accounts.svg'
  }
  if (normalized.includes('софт') || normalized.includes('software') || normalized.includes('программ')) {
    return '/stock-listings/software.svg'
  }

  return defaultListingImage
}

export const siteCurrency = 'VT'

export const formatPrice = (price: number, currency = siteCurrency) => {
  const displayCurrency = currency === 'RUB' ? siteCurrency : currency
  const value = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(price)

  return `${value} ${displayCurrency}`
}

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))

export const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

export const getErrorMessage = (error: unknown, fallback = 'Произошла ошибка') => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const data = (error as { response?: { data?: { detail?: string } } }).response?.data
    if (data?.detail) return data.detail
  }
  if (error instanceof Error) return error.message
  return fallback
}

export const assetUrl = (path?: string) => {
  if (!path) return undefined
  if (path.startsWith('http') || path.startsWith('data:')) return path
  if (path.startsWith('/stock-listings/')) return path
  return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`
}

export const listingImageUrl = (path?: string, categoryName?: string) => {
  const fallback = stockImageForCategory(categoryName)

  if (!path) return fallback
  if (path.startsWith('/uploads/') || path.includes('/uploads/')) return fallback

  return assetUrl(path) ?? fallback
}
