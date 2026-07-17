const productionApiUrl = 'https://marketplace-1-wbt4.onrender.com/api/v1'

export const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.PROD ? productionApiUrl : '/api/v1')

export const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '')
