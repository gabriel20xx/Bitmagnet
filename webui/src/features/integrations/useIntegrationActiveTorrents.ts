import { useQuery } from '@apollo/client/react'
import { IntegrationActiveTorrentsDocument, type IntegrationActiveTorrentOrderByField } from '@/lib/graphql/generated'

export interface ActiveTorrentsOrderBy {
  field: IntegrationActiveTorrentOrderByField
  descending: boolean
}

// Fetches the integration client's full active-torrents list once per integration (qBittorrent
// has no server-side pagination anyway - the backend already fetches everything from it in one
// call). Sorting and pagination are then done client-side in the panel, so paging/sorting through
// an open panel is instant instead of round-tripping to the backend (and from there to
// qBittorrent) on every click.
export function useIntegrationActiveTorrents(integrationId: string | null) {
  const { data, loading, error, refetch } = useQuery(IntegrationActiveTorrentsDocument, {
    variables: { id: integrationId ?? '' },
    skip: integrationId == null,
    fetchPolicy: 'network-only',
  })

  return {
    torrents: data?.integrationActiveTorrents.items ?? [],
    loading,
    error,
    refresh: () => void refetch(),
  }
}
