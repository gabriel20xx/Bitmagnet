export interface ThemeInfo {
  key: string
  label: string
  dark: boolean
}

export const themes = {
  classic: { key: 'classic', label: 'Light', dark: false },
  tundra: { key: 'tundra', label: 'Dark', dark: true },
} as const satisfies Record<string, ThemeInfo>

export type ThemeKey = keyof typeof themes

export const lightTheme: ThemeKey = 'classic'
export const darkTheme: ThemeKey = 'tundra'
