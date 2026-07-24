import { useTranslation } from 'react-i18next'
import { Check, Download, Fingerprint, Magnet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resolveTorrentDownloadUrl } from '@/lib/graphql/endpoint'
import { useCopyFeedback } from '@/lib/hooks/useCopyFeedback'
import { SendToIntegrationButtons } from '@/features/integrations/SendToIntegrationButtons'
import type { TorrentContentFragment } from '@/lib/graphql/generated'

export function TorrentsBulkActions({ selectedItems }: { selectedItems: TorrentContentFragment[] }) {
  const { t } = useTranslation()
  const [magnetsCopied, copyMagnets] = useCopyFeedback()
  const [infoHashesCopied, copyInfoHashes] = useCopyFeedback()

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
      <SendToIntegrationButtons infoHashes={infoHashes} />
      <Button
        type="button"
        variant="outline"
        disabled={!hasSelection}
        onClick={() => copyMagnets(selectedItems.map((i) => i.torrent.magnetUri).join('\n'))}
      >
        {magnetsCopied ? <Check className="size-4" /> : <Magnet className="size-4" />}
        {t('torrents.copy')} {t('torrents.magnet_links')}
      </Button>
      <Button type="button" variant="outline" disabled={!hasSelection} onClick={downloadTorrents}>
        <Download className="size-4" />
        {t('torrents.download_torrents')}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={!hasSelection}
        onClick={() => copyInfoHashes(infoHashes.join('\n'))}
      >
        {infoHashesCopied ? <Check className="size-4" /> : <Fingerprint className="size-4" />}
        {t('torrents.copy')} {t('torrents.info_hashes')}
      </Button>
    </div>
  )
}
