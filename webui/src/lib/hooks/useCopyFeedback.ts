import { useCallback, useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '@/lib/utils/clipboard'

export function useCopyFeedback(durationMs = 1500) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const copy = useCallback(
    (text: string) => {
      copyToClipboard(text)
        .then(() => {
          clearTimeout(timeoutRef.current)
          setCopied(true)
          timeoutRef.current = setTimeout(() => setCopied(false), durationMs)
        })
        .catch(() => {})
    },
    [durationMs],
  )

  return [copied, copy] as const
}
