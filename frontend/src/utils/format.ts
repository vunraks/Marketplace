import { apiOrigin } from '../config/api'

export const imagePlaceholder = 'https://placehold.co/600x400?text=VaultTrade'

export const siteCurrency = 'VT'

export const formatPrice = (price: number, currency = siteCurrency) => {
  const displayCurrency = currency === 'RUB' ? siteCurrency : currency
  const value = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(price)

  return `${value} ${displayCurrency}`
}

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))

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
  if (path.startsWith('http')) return path
  return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`
}
