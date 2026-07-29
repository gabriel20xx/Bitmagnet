import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { Paginator } from '@/components/ui/paginator'
import { formatFilesize } from '@/lib/utils/filesize'
import type { IntegrationActiveTorrentOrderByField } from '@/lib/graphql/generated'
import { useIntegrationActiveTorrents, type ActiveTorrentsOrderBy } from './useIntegrationActiveTorrents'

const orderByFields: IntegrationActiveTorrentOrderByField[] = [
  'name',
  'progress',
  'state',
  'downloadSpeed',
  'eta',
  'size',
]

// qBittorrent reports this (or similar very large values) as the ETA when it's unknown - e.g.
// stalled or no peers - rather than omitting the field.
const UNKNOWN_ETA_THRESHOLD_SECONDS = 100 * 24 * 60 * 60

function formatEta(seconds: number, t: (key: string) => string): string {
  if (seconds >= UNKNOWN_ETA_THRESHOLD_SECONDS) return '—'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`

  return t('integrations.eta_less_than_a_minute')
}

const orderByFieldLabelKey: Record<IntegrationActiveTorrentOrderByField, string> = {
  name: 'torrents.title',
  progress: 'integrations.progress',
  state: 'integrations.state',
  downloadSpeed: 'integrations.download_speed',
  eta: 'integrations.eta',
  size: 'torrents.size',
}

function compareByField(
  a: { name: string; progress: number; state: string; downloadSpeed: number; eta: number; size: number },
  b: typeof a,
  field: IntegrationActiveTorrentOrderByField,
): number {
  switch (field) {
    case 'progress':
      return a.progress - b.progress
    case 'state':
      return a.state.localeCompare(b.state)
    case 'downloadSpeed':
      return a.downloadSpeed - b.downloadSpeed
    case 'eta':
      return a.eta - b.eta
    case 'size':
      return a.size - b.size
    case 'name':
    default:
      return a.name.localeCompare(b.name)
  }
}

export function IntegrationActiveTorrentsPanel({ integrationId }: { integrationId: string }) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [orderBy, setOrderBy] = useState<ActiveTorrentsOrderBy>({ field: 'progress', descending: true })

  const { torrents: allTorrents, loading, error, refresh } = useIntegrationActiveTorrents(integrationId)

  const sorted = useMemo(() => {
    const items = [...allTorrents].sort((a, b) => compareByField(a, b, orderBy.field))
    if (orderBy.descending) items.reverse()
    return items
  }, [allTorrents, orderBy])

  const totalCount = sorted.length
  const torrents = useMemo(
    () => sorted.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    [sorted, page, pageSize],
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={orderBy.field}
          onValueChange={(field) => {
            setOrderBy((prev) => ({ ...prev, field: field as IntegrationActiveTorrentOrderByField }))
            setPage(1)
          }}
        >
          <SelectTrigger className="min-w-0 flex-1 sm:w-44 sm:flex-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderByFields.map((field) => (
              <SelectItem key={field} value={field}>
                {t(orderByFieldLabelKey[field])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SimpleTooltip label={t('torrents.order_direction_toggle')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setOrderBy((prev) => ({ ...prev, descending: !prev.descending }))
              setPage(1)
            }}
          >
            {orderBy.descending ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label={t('torrents.refresh')}>
          <Button type="button" variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="size-4" />
          </Button>
        </SimpleTooltip>
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && !loading && torrents.length === 0 && (
        <p className="text-sm text-muted-fg">{t('integrations.no_active_torrents')}</p>
      )}

      {torrents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-[42rem] w-full text-left text-sm">
            <thead>
              <tr className="text-muted-fg">
                <th className="py-1.5 font-medium">{t('torrents.title')}</th>
                <th className="py-1.5 font-medium">{t('integrations.progress')}</th>
                <th className="py-1.5 font-medium">{t('integrations.state')}</th>
                <th className="py-1.5 font-medium">{t('integrations.download_speed')}</th>
                <th className="py-1.5 font-medium">{t('integrations.eta')}</th>
                <th className="py-1.5 font-medium">{t('torrents.size')}</th>
              </tr>
            </thead>
            <tbody>
              {torrents.map((torrent) => (
                <tr key={torrent.hash} className="border-t border-border">
                  <td className="max-w-xs truncate py-1.5" title={torrent.name}>
                    {torrent.name}
                  </td>
                  <td className="py-1.5">{Math.round(torrent.progress * 100)}%</td>
                  <td className="py-1.5 text-muted-fg">{torrent.state}</td>
                  <td className="py-1.5">{formatFilesize(torrent.downloadSpeed, i18n.language)}/s</td>
                  <td className="py-1.5">{formatEta(torrent.eta, t)}</td>
                  <td className="py-1.5">{formatFilesize(torrent.size, i18n.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalCount > 0 && (
        <Paginator
          page={page}
          pageSize={pageSize}
          pageLength={torrents.length}
          totalLength={totalCount}
          showLastPage
          onPaging={(event) => {
            setPage(event.page)
            setPageSize(event.pageSize)
          }}
        />
      )}
    </div>
  )
}
