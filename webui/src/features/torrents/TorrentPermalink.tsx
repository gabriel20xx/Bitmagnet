import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@apollo/client/react'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { TorrentContentSearchDocument } from '@/lib/graphql/generated'
import { TorrentContent } from './TorrentContent'

const infoHashPattern = /^[0-9a-f]{40}$/

export function TorrentPermalink() {
  const { infoHash } = useParams()
  const navigate = useNavigate()
  const valid = !!infoHash && infoHashPattern.test(infoHash)

  const { data, loading } = useQuery(TorrentContentSearchDocument, {
    variables: { input: { infoHashes: valid ? [infoHash!] : [] } },
    skip: !valid,
    fetchPolicy: 'no-cache',
  })

  const torrentContent = data?.torrentContent.search.items[0]

  useEffect(() => {
    if (!valid || (!loading && data && !torrentContent)) {
      void navigate('/not-found', { replace: true })
    }
  }, [valid, loading, data, torrentContent, navigate])

  useDocumentTitle(torrentContent?.torrent.name)

  if (!torrentContent) return null

  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <TorrentContent torrentContent={torrentContent} />
    </div>
  )
}
