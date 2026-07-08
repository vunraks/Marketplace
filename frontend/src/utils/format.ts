export const formatPrice = (price: number, currency = 'RUB') =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

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
  return `http://localhost:5000${path.startsWith('/') ? path : `/${path}`}`
}
