import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { defaultLang, languages } from './languages'

import ar from './locales/ar.json'
import ca from './locales/ca.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import hi from './locales/hi.json'
import ja from './locales/ja.json'
import nl from './locales/nl.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import tr from './locales/tr.json'
import uk from './locales/uk.json'
import zh from './locales/zh.json'

const resources = {
  ar: { translation: ar },
  ca: { translation: ca },
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  hi: { translation: hi },
  ja: { translation: ja },
  nl: { translation: nl },
  pt: { translation: pt },
  ru: { translation: ru },
  tr: { translation: tr },
  uk: { translation: uk },
  zh: { translation: zh },
}

const STORAGE_KEY = 'bitmagnet-language'

const rtlLanguages = new Set(['ar'])

export function applyDocumentDirection(lang: string) {
  document.documentElement.lang = lang
  document.documentElement.dir = rtlLanguages.has(lang) ? 'rtl' : 'ltr'
}

function getStoredLanguage(): string | undefined {
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value && value in resources ? value : undefined
}

function getAutoLanguage(): string {
  const navLang = navigator.language?.split('-')?.[0]
  return navLang && navLang in resources ? navLang : defaultLang
}

export function setStoredLanguage(lang: string) {
  window.localStorage.setItem(STORAGE_KEY, lang)
}

export const preferredLanguage = getStoredLanguage() ?? getAutoLanguage()

void i18n.use(initReactI18next).init({
  resources,
  lng: preferredLanguage,
  fallbackLng: defaultLang,
  supportedLngs: languages.map((l) => l.id),
  interpolation: { escapeValue: false },
})

applyDocumentDirection(preferredLanguage)

i18n.on('languageChanged', applyDocumentDirection)

export default i18n
