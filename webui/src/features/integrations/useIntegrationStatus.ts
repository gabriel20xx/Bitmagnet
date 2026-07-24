import { useEffect, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { TestSavedIntegrationDocument, type IntegrationFragment } from '@/lib/graphql/generated'

export type IntegrationStatus = 'checking' | 'connected' | 'disconnected' | 'disabled'

// Disabled integrations are never checked. Enabled ones are silently re-tested (no error toast -
// this runs automatically, not from a user action) whenever their saved connection details
// change, so the status column reflects the latest edit.
export function useIntegrationStatus(integration: IntegrationFragment): IntegrationStatus {
  const [testSaved] = useMutation(TestSavedIntegrationDocument)
  const [status, setStatus] = useState<IntegrationStatus>(integration.enabled ? 'checking' : 'disabled')

  useEffect(() => {
    if (!integration.enabled) {
      setStatus('disabled')
      return
    }

    let cancelled = false
    setStatus('checking')

    testSaved({ variables: { id: integration.id } })
      .then(() => {
        if (!cancelled) setStatus('connected')
      })
      .catch(() => {
        if (!cancelled) setStatus('disconnected')
      })

    return () => {
      cancelled = true
    }
  }, [integration.id, integration.enabled, integration.url, integration.username, integration.updatedAt, testSaved])

  return status
}
