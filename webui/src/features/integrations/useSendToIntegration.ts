import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { addError } from '@/lib/toast/store'
import { SendTorrentsToIntegrationDocument } from '@/lib/graphql/generated'

// Tracks which integration a send last succeeded for, briefly, so the triggering control can
// show a checkmark - mirrors useCopyFeedback's transient success indicator.
export function useSendToIntegration(durationMs = 1500) {
  const [mutate] = useMutation(SendTorrentsToIntegrationDocument)
  const [sentId, setSentId] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const send = useCallback(
    (integrationId: string, infoHashes: string[]) => {
      mutate({ variables: { integrationId, infoHashes } })
        .then(() => {
          clearTimeout(timeoutRef.current)
          setSentId(integrationId)
          timeoutRef.current = setTimeout(() => setSentId(null), durationMs)
        })
        .catch((err: Error) => addError(err.message))
    },
    [mutate, durationMs],
  )

  return { send, sentId }
}
