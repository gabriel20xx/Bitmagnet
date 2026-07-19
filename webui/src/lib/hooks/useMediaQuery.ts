import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Roughly matches Angular CDK's Breakpoints.Medium (>=960px), used to switch between compact and full layouts. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 960px)')
}
