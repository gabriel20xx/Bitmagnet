export interface Language {
  id: string
  label: string
}

export const languages: Language[] = [
  { id: 'ar', label: 'العربية' },
  { id: 'ca', label: 'Català' },
  { id: 'de', label: 'Deutsch' },
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'ja', label: '日本語' },
  { id: 'nl', label: 'Nederlands' },
  { id: 'pt', label: 'Português' },
  { id: 'ru', label: 'Русский' },
  { id: 'tr', label: 'Türkçe' },
  { id: 'uk', label: 'Українська' },
  { id: 'zh', label: '中文' },
]

export const defaultLang = 'en'
