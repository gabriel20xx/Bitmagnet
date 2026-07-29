import { useEffect, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { TestSavedIntegrationDocument, type IntegrationFragment } from '@/lib/graphql/generated'

export type IntegrationStatus = 'checking' | 'connected' | 'disconnected' | 'disabled'

// Disabled integrations are never checked. Enabled ones are silently re-tested (no error toast -
// this runs automatically, not from a user action) whenever their saved connection details
// change, so the status column reflects the latest edit.
export function useIntegrationStatus(integration: IntegrationFragment): IntegrationStatus {
  const [testSaved] = useMutation(TestSavedIntegrationDocument)
  const requestKey = JSON.stringify([
    integration.id,
    integration.enabled,
    integration.url,
    integration.username,
    integration.updatedAt,
  ])
  const [statusState, setStatusState] = useState<{ key: string; status: IntegrationStatus }>(() => ({
    key: requestKey,
    status: integration.enabled ? 'checking' : 'disabled',
  }))

  useEffect(() => {
    if (!integration.enabled) return

    let cancelled = false

    testSaved({ variables: { id: integration.id } })
      .then(() => {
        if (!cancelled) setStatusState({ key: requestKey, status: 'connected' })
      })
      .catch(() => {
        if (!cancelled) setStatusState({ key: requestKey, status: 'disconnected' })
      })

    return () => {
      cancelled = true
    }
  }, [integration.enabled, integration.id, requestKey, testSaved])

  if (statusState.key !== requestKey) return integration.enabled ? 'checking' : 'disabled'
  return statusState.status
}
