const productionApiUrl = 'https://marketplace-1-wbt4.onrender.com/api/v1'
const defaultGoogleClientId = '689780156024-7uahkekh3ol3f9du70k667it8or37i6d.apps.googleusercontent.com'

export const apiBaseUrl =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.PROD ? productionApiUrl : '/api/v1')

export const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, '')

export const googleClientId =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ??
  defaultGoogleClientId
