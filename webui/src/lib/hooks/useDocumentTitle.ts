import { useEffect } from 'react'

export function useDocumentTitle(...parts: Array<string | null | undefined>) {
  useEffect(() => {
    document.title = [...parts.filter(Boolean), 'bitmagnet'].join(' - ')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, parts)
}
