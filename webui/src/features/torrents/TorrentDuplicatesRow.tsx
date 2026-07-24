import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client/react'
import { Magnet, Download } from 'lucide-react'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { formatFilesize } from '@/lib/utils/filesize'
import { formatTimeAgo } from '@/lib/dates/format'
import { resolveTorrentDownloadUrl } from '@/lib/graphql/endpoint'
import { addError } from '@/lib/toast/store'
import { TorrentSendIcon } from '@/features/integrations/TorrentSendIcon'
import { TorrentContentSearchDocument } from '@/lib/graphql/generated'

export function TorrentDuplicatesRow({ infoHash, colSpan }: { infoHash: string; colSpan: number }) {
  const { t, i18n } = useTranslation()

  const { data, loading, error } = useQuery(TorrentContentSearchDocument, {
    variables: { input: { duplicatesOf: infoHash, limit: 100 } },
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (error) addError(`Error loading duplicates: ${error.message}`)
  }, [error])

  const items = data?.torrentContent.search.items ?? []

  return (
    <tr className="border-t border-border bg-surface/50">
      <td colSpan={colSpan} className="p-4">
        {!loading && items.length === 0 && <p className="text-sm text-muted-fg">{t('torrents.no_duplicates_found')}</p>}
        <ul className="space-y-2">
          {items.map((dup) => (
            <li key={dup.infoHash} className="flex items-center justify-between gap-4 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{dup.torrent.name}</div>
                <p className="text-xs text-muted-fg">
                  {formatFilesize(dup.torrent.size, i18n.language)} · {dup.seeders ?? '?'} / {dup.leechers ?? '?'} ·{' '}
                  {formatTimeAgo(dup.publishedAt, i18n.language)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <TorrentSendIcon infoHash={dup.infoHash} />
                <SimpleTooltip label={t('torrents.magnet')}>
                  <a href={dup.torrent.magnetUri} className="cursor-pointer">
                    <Magnet className="size-4 text-primary" />
                  </a>
                </SimpleTooltip>
                <SimpleTooltip label={t('torrents.download_torrent_file')}>
                  <a href={resolveTorrentDownloadUrl(dup.infoHash)} className="cursor-pointer">
                    <Download className="size-4 text-primary" />
                  </a>
                </SimpleTooltip>
              </div>
            </li>
          ))}
        </ul>
      </td>
    </tr>
  )
}
