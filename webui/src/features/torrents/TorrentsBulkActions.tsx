import { useTranslation } from 'react-i18next'
import { Download, Fingerprint, Magnet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { resolveTorrentDownloadUrl } from '@/lib/graphql/endpoint'
import { copyToClipboard } from '@/lib/utils/clipboard'
import type { TorrentContentFragment } from '@/lib/graphql/generated'

export function TorrentsBulkActions({ selectedItems }: { selectedItems: TorrentContentFragment[] }) {
  const { t } = useTranslation()

  const infoHashes = selectedItems.map((i) => i.infoHash)
  const hasSelection = infoHashes.length > 0

  const downloadTorrents = () => {
    infoHashes.forEach((infoHash, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = resolveTorrentDownloadUrl(infoHash)
        a.download = `${infoHash}.torrent`
        document.body.appendChild(a)
        a.click()
        a.remove()
      }, i * 150)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
        <Button
          type="button"
          variant="outline"
          disabled={!hasSelection}
          onClick={() => {
            copyToClipboard(selectedItems.map((i) => i.torrent.magnetUri).join('\n')).catch(() => {})
          }}
        >
          <Magnet className="size-4" />
          {t('torrents.magnet_links')}
        </Button>
      </SimpleTooltip>
      <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
        <Button
          type="button"
          variant="outline"
          disabled={!hasSelection}
          onClick={() => {
            copyToClipboard(infoHashes.join('\n')).catch(() => {})
          }}
        >
          <Fingerprint className="size-4" />
          {t('torrents.info_hashes')}
        </Button>
      </SimpleTooltip>
      <Button type="button" variant="outline" disabled={!hasSelection} onClick={downloadTorrents}>
        <Download className="size-4" />
        {t('torrents.download_torrents')}
      </Button>
    </div>
  )
}
