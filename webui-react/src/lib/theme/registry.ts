export interface ThemeInfo {
  key: string
  label: string
  dark: boolean
}

export const themes = {
  classic: { key: 'classic', label: 'Classic', dark: false },
  clean: { key: 'clean', label: 'Clean', dark: false },
  neon: { key: 'neon', label: 'Neon', dark: true },
  tundra: { key: 'tundra', label: 'Tundra', dark: true },
} as const satisfies Record<string, ThemeInfo>

export type ThemeKey = keyof typeof themes

export const themeList = Object.values(themes)

export const defaultLightTheme: ThemeKey = 'classic'
export const defaultDarkTheme: ThemeKey = 'tundra'

export function isThemeKey(value: string): value is ThemeKey {
  return value in themes
}
