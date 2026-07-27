import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { LoaderCircle } from 'lucide-react'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { TorrentContentSearchDocument } from '@/lib/graphql/generated'
import { TorrentContent } from './TorrentContent'

const infoHashPattern = /^[0-9a-f]{40}$/

export function TorrentPermalink() {
  const { t } = useTranslation()
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

  if (!torrentContent) {
    if (!loading) return null

    return (
      <div className="rounded-lg border border-border bg-bg p-4">
        <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-fg">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          {t('torrents.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <TorrentContent torrentContent={torrentContent} />
    </div>
  )
}
