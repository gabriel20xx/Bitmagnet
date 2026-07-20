import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { darkTheme, lightTheme, type ThemeKey } from './registry'

const STORAGE_KEY = 'bitmagnet-theme'

function prefersDarkMediaQuery(): MediaQueryList | undefined {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : undefined
}

function getStoredIsDark(): boolean | undefined {
  const value = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
  return value === darkTheme ? true : value === lightTheme ? false : undefined
}

interface ThemeContextValue {
  theme: ThemeKey
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => getStoredIsDark() ?? prefersDarkMediaQuery()?.matches ?? false)

  useEffect(() => {
    const mql = prefersDarkMediaQuery()
    if (!mql || getStoredIsDark() !== undefined) return
    const onChange = () => setIsDark(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const theme = isDark ? darkTheme : lightTheme

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      window.localStorage.setItem(STORAGE_KEY, next ? darkTheme : lightTheme)
      return next
    })
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, isDark, toggleTheme }), [theme, isDark, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
