type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            ux_mode?: 'popup'
          }) => void
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

const googleScriptId = 'google-identity-services'

const loadGoogleScript = () => new Promise<void>((resolve, reject) => {
  if (window.google?.accounts?.id) {
    resolve()
    return
  }

  const existing = document.getElementById(googleScriptId) as HTMLScriptElement | null
  if (existing) {
    existing.addEventListener('load', () => resolve(), { once: true })
    existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Google авторизацию')), { once: true })
    return
  }

  const script = document.createElement('script')
  script.id = googleScriptId
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  script.onload = () => resolve()
  script.onerror = () => reject(new Error('Не удалось загрузить Google авторизацию'))
  document.head.appendChild(script)
})

export const getGoogleIdToken = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!clientId) {
    throw new Error('Google Client ID не настроен')
  }

  await loadGoogleScript()

  return new Promise<string>((resolve, reject) => {
    let settled = false

    window.google?.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      callback: (response) => {
        if (response.credential) {
          settled = true
          resolve(response.credential)
          return
        }

        reject(new Error('Google не вернул токен входа'))
      },
    })

    window.google?.accounts.id.prompt((notification) => {
      if (settled) return
      if (notification.isNotDisplayed()) {
        settled = true
        reject(new Error(`Google вход не показан: ${notification.getNotDisplayedReason()}`))
      }
      if (notification.isSkippedMoment()) {
        settled = true
        reject(new Error(`Google вход отменён: ${notification.getSkippedReason()}`))
      }
    })
  })
}
