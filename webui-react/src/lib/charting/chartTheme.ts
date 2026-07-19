/**
 * Chart.js cannot consume CSS custom properties directly, so colors are resolved from the
 * live computed style at render time. This mirrors the Angular ThemeEmitter trick, but the
 * Angular app's ThemeInfoService exposed a full lightness ramp per hue (e.g. `primary-20` ..
 * `primary-80`) used to derive distinct border/point/hover colors for chart series. The React
 * app's semantic token set only defines a single value per color, so instead of a lightness
 * ramp we derive the same set of visually distinct shades via alpha blending.
 */
export type ChartBaseColor = 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'warning' | 'muted-fg'

export function getChartColor(name: ChartBaseColor): string {
  if (typeof document === 'undefined') return '#888888'
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()
  return value || '#888888'
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface SeriesColors {
  border: string
  pointBackground: string
  pointBorder: string
  pointHoverBackground: string
  pointHoverBorder: string
}

export function seriesColors(base: ChartBaseColor): SeriesColors {
  const color = getChartColor(base)
  return {
    border: withAlpha(color, 0.85),
    pointBackground: withAlpha(color, 0.35),
    pointBorder: withAlpha(color, 0.95),
    pointHoverBackground: withAlpha(color, 0.6),
    pointHoverBorder: withAlpha(color, 0.8),
  }
}
