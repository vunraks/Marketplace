import { telegramClientId } from '../config/api'

const stateKey = 'vaulttrade.telegramOidc.state'
const verifierKey = 'vaulttrade.telegramOidc.verifier'

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const randomBase64Url = (byteLength: number) => {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

const sha256Base64Url = async (value: string) => {
  const encoded = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return base64UrlEncode(new Uint8Array(digest))
}

export const telegramOidcRedirectUri = () => `${window.location.origin}/auth/telegram/callback`

export const startTelegramOidcLogin = async () => {
  if (!telegramClientId) {
    throw new Error('Telegram Client ID не настроен')
  }

  const state = randomBase64Url(24)
  const verifier = randomBase64Url(48)
  const challenge = await sha256Base64Url(verifier)

  sessionStorage.setItem(stateKey, state)
  sessionStorage.setItem(verifierKey, verifier)

  const params = new URLSearchParams({
    client_id: telegramClientId,
    redirect_uri: telegramOidcRedirectUri(),
    response_type: 'code',
    scope: 'openid profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`https://oauth.telegram.org/auth?${params.toString()}`)
}

export const consumeTelegramOidcSession = (state: string | null) => {
  const storedState = sessionStorage.getItem(stateKey)
  const verifier = sessionStorage.getItem(verifierKey)
  sessionStorage.removeItem(stateKey)
  sessionStorage.removeItem(verifierKey)

  if (!state || !storedState || state !== storedState) {
    throw new Error('Telegram state не совпал, попробуйте войти ещё раз')
  }

  if (!verifier) {
    throw new Error('Telegram code verifier не найден, попробуйте войти ещё раз')
  }

  return verifier
}
