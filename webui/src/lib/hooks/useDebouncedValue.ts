import { useEffect, useState } from 'react'

/** Debounces a value by delayMs, mirroring the rxjs `debounceTime` used by the Angular controllers this app replaces. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(handle)
  }, [value, delayMs])

  return debounced
}
