import { telegramBotUsername } from '../config/api'

export interface TelegramAuthPayload {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

declare global {
  interface Window {
    [key: `onTelegramAuth_${string}`]: ((user: TelegramAuthPayload) => void) | undefined
  }
}

export const renderTelegramLoginButton = (
  parent: HTMLElement,
  onAuth: (payload: TelegramAuthPayload) => void,
  onError: (message: string) => void,
) => {
  if (!telegramBotUsername) {
    onError('Telegram Bot Username не настроен')
    return () => undefined
  }

  parent.innerHTML = ''
  const callbackName = `onTelegramAuth_${crypto.randomUUID().replace(/-/g, '')}` as const

  window[callbackName] = (user: TelegramAuthPayload) => {
    if (!user?.id || !user?.hash || !user?.auth_date) {
      onError('Telegram не вернул данные входа')
      return
    }

    onAuth(user)
  }

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', telegramBotUsername)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-radius', '10')
  script.setAttribute('data-request-access', 'write')
  script.setAttribute('data-onauth', `${callbackName}(user)`)

  parent.appendChild(script)

  return () => {
    delete window[callbackName]
    parent.innerHTML = ''
  }
}
