import { googleClientId } from '../config/api'

type GoogleCredentialResponse = {
  credential?: string
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
            use_fedcm_for_button?: boolean
          }) => void
          renderButton: (parent: HTMLElement, options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
            text?: GoogleButtonText
            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            width?: number | string
            locale?: string
          }) => void
        }
      }
    }
  }
}

const googleScriptId = 'google-identity-services'
let initializedClientId: string | null = null
let credentialHandler: ((idToken: string) => void) | null = null
let errorHandler: ((message: string) => void) | null = null

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

const initializeGoogle = () => {
  if (initializedClientId === googleClientId) return

  window.google?.accounts.id.initialize({
    client_id: googleClientId,
    ux_mode: 'popup',
    use_fedcm_for_prompt: false,
    use_fedcm_for_button: false,
    callback: (response) => {
      if (response.credential) {
        credentialHandler?.(response.credential)
        return
      }

      errorHandler?.('Google не вернул токен входа')
    },
  })

  initializedClientId = googleClientId
}

export const renderGoogleSignInButton = async (
  parent: HTMLElement,
  onCredential: (idToken: string) => void,
  onError: (message: string) => void,
  text: GoogleButtonText = 'signin_with',
) => {
  if (!googleClientId) {
    onError('Google Client ID не настроен')
    return
  }

  credentialHandler = onCredential
  errorHandler = onError

  await loadGoogleScript()
  initializeGoogle()

  parent.innerHTML = ''
  window.google?.accounts.id.renderButton(parent, {
    theme: 'outline',
    size: 'large',
    text,
    shape: 'rectangular',
    width: 360,
    locale: 'ru',
  })
}
