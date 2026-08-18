import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { languageLabels, supportedLanguages, translations, type LanguageCode, type TranslationKey } from './translations'

const storageKey = 'vaulttrade-language'

type LanguageContextValue = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const isSupportedLanguage = (value: string): value is LanguageCode =>
  supportedLanguages.includes(value as LanguageCode)

const detectLanguage = (): LanguageCode => {
  const stored = localStorage.getItem(storageKey)
  if (stored && isSupportedLanguage(stored)) return stored

  const browserLanguage = navigator.language.split('-')[0].toLowerCase()
  if (isSupportedLanguage(browserLanguage)) return browserLanguage

  return 'ru'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(detectLanguage)

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (nextLanguage) => {
      localStorage.setItem(storageKey, nextLanguage)
      setLanguageState(nextLanguage)
    },
    t: (key) => translations[language][key] ?? translations.ru[key],
  }), [language])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useTranslation must be used inside LanguageProvider')
  return { ...context, languageLabels, supportedLanguages }
}
