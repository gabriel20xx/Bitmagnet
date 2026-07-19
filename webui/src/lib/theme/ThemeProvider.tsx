import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultDarkTheme, defaultLightTheme, isThemeKey, themeList, type ThemeKey } from './registry'

const STORAGE_KEY = 'bitmagnet-theme'

function prefersDarkMediaQuery(): MediaQueryList | undefined {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : undefined
}

function getAutoTheme(): ThemeKey {
  return prefersDarkMediaQuery()?.matches ? defaultDarkTheme : defaultLightTheme
}

function getStoredTheme(): ThemeKey | undefined {
  const value = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
  return value && isThemeKey(value) ? value : undefined
}

interface ThemeContextValue {
  theme: ThemeKey
  /** undefined when following "auto" (system preference) */
  selectedTheme: ThemeKey | undefined
  themes: typeof themeList
  setTheme: (theme: ThemeKey | 'auto') => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | undefined>(() => getStoredTheme())
  const [autoTheme, setAutoTheme] = useState<ThemeKey>(() => getAutoTheme())

  useEffect(() => {
    const mql = prefersDarkMediaQuery()
    if (!mql) return
    const onChange = () => setAutoTheme(getAutoTheme())
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const theme = selectedTheme ?? autoTheme

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeKey | 'auto') => {
    if (next === 'auto') {
      window.localStorage.removeItem(STORAGE_KEY)
      setSelectedTheme(undefined)
      setAutoTheme(getAutoTheme())
    } else {
      window.localStorage.setItem(STORAGE_KEY, next)
      setSelectedTheme(next)
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, selectedTheme, themes: themeList, setTheme }),
    [theme, selectedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
