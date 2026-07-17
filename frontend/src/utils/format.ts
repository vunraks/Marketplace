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
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/v1\/?$/, '') ?? ''
  return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`
}
