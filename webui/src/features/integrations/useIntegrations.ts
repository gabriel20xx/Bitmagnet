import { useQuery } from '@apollo/client/react'
import { IntegrationsDocument } from '@/lib/graphql/generated'

export function useIntegrations() {
  const { data, loading, error, refetch } = useQuery(IntegrationsDocument, { fetchPolicy: 'cache-and-network' })

  return {
    integrations: data?.integrations ?? [],
    enabledIntegrations: (data?.integrations ?? []).filter((i) => i.enabled),
    loading,
    error,
    refetch,
  }
}
