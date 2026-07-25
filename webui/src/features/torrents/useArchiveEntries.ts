import { useQuery } from '@apollo/client/react'
import { ArchiveEntriesDocument } from '@/lib/graphql/generated'

// Lazily lists the contents of an archive file inside a torrent - skipped until the caller
// actually wants them (e.g. the archive's row has been expanded in the file tree), since
// unlike every other torrent-related query this fetches bytes live from BitTorrent peers
// rather than reading the database.
export function useArchiveEntries(infoHash: string, index: number, enabled: boolean) {
  const { data, loading, error } = useQuery(ArchiveEntriesDocument, {
    variables: { infoHash, index },
    skip: !enabled,
    fetchPolicy: 'no-cache',
  })

  return {
    entries: data?.torrent.archiveEntries ?? [],
    loading,
    error,
  }
}
