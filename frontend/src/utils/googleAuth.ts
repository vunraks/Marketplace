import { googleClientId } from '../config/api'

type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
}

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            ux_mode?: 'popup'
            use_fedcm_for_prompt?: boolean
          }) => void
          renderButton: (parent: HTMLElement, options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
            text?: GoogleButtonText
            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            width?: number | string
            locale?: string
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

export const renderGoogleSignInButton = async (
  parent: HTMLElement,
  onCredential: (idToken: string) => void,
  onError: (message: string) => void,
  text: GoogleButtonText = 'signin_with',
) => {
  const clientId = googleClientId
  if (!clientId) {
    onError('Google Client ID не настроен')
    return
  }

  await loadGoogleScript()

  parent.innerHTML = ''
  window.google?.accounts.id.initialize({
    client_id: clientId,
    ux_mode: 'popup',
    use_fedcm_for_prompt: true,
    callback: (response) => {
      if (response.credential) {
        onCredential(response.credential)
        return
      }

      onError('Google не вернул токен входа')
    },
  })

  window.google?.accounts.id.renderButton(parent, {
    theme: 'outline',
    size: 'large',
    text,
    shape: 'rectangular',
    width: 360,
    locale: 'ru',
  })
}

export const getGoogleIdToken = async () => {
  const clientId = googleClientId
  if (!clientId) {
    throw new Error('Google Client ID не настроен')
  }

  await loadGoogleScript()

  return new Promise<string>((resolve, reject) => {
    let settled = false

    window.google?.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      use_fedcm_for_prompt: true,
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
