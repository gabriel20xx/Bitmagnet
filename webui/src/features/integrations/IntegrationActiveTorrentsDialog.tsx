import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatFilesize } from '@/lib/utils/filesize'
import type { IntegrationFragment } from '@/lib/graphql/generated'
import { useIntegrationActiveTorrents } from './useIntegrationActiveTorrents'

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

export function IntegrationActiveTorrentsDialog({
  integration,
  onOpenChange,
}: {
  integration: IntegrationFragment | null
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const { torrents, loading, error, refetch } = useIntegrationActiveTorrents(integration?.id ?? null)

  return (
    <Dialog open={integration != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {integration && t('integrations.active_torrents_title', { name: integration.name })}
          </DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-danger">{error.message}</p>}

        {!error && !loading && torrents.length === 0 && (
          <p className="text-sm text-muted-fg">{t('integrations.no_active_torrents')}</p>
        )}

        {torrents.length > 0 && (
          <table className="w-full text-left text-sm">
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
        )}

        <DialogFooter>
          <Button type="button" variant="outline" size="icon" disabled={loading} onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
