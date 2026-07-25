import { useQuery } from '@apollo/client/react'
import { IntegrationActiveTorrentsDocument, type IntegrationActiveTorrentOrderByField } from '@/lib/graphql/generated'

export interface ActiveTorrentsOrderBy {
  field: IntegrationActiveTorrentOrderByField
  descending: boolean
}

export function useIntegrationActiveTorrents(
  integrationId: string | null,
  page: number,
  pageSize: number,
  orderBy: ActiveTorrentsOrderBy,
) {
  const { data, loading, error, refetch } = useQuery(IntegrationActiveTorrentsDocument, {
    variables: {
      id: integrationId ?? '',
      input: {
        page,
        limit: pageSize,
        orderBy: { field: orderBy.field, descending: orderBy.descending },
      },
    },
    skip: integrationId == null,
    fetchPolicy: 'network-only',
  })

  return {
    totalCount: data?.integrationActiveTorrents.totalCount ?? 0,
    torrents: data?.integrationActiveTorrents.items ?? [],
    loading,
    error,
    refetch,
  }
}
