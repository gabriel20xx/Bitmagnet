import { useQuery } from '@apollo/client/react'
import { IntegrationActiveTorrentsDocument } from '@/lib/graphql/generated'

export function useIntegrationActiveTorrents(integrationId: string | null) {
  const { data, loading, error, refetch } = useQuery(IntegrationActiveTorrentsDocument, {
    variables: { id: integrationId ?? '' },
    skip: integrationId == null,
    fetchPolicy: 'network-only',
  })

  return {
    torrents: data?.integrationActiveTorrents ?? [],
    loading,
    error,
    refetch,
  }
}
