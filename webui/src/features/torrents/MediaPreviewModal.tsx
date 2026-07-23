import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { resolveTorrentFileStreamUrl } from '@/lib/graphql/endpoint'
import type { FileType } from '@/lib/graphql/generated'

interface PreviewableNode {
  name: string
  index: number
  fileType: FileType | null
}

type Availability = { status: 'checking' } | { status: 'ready' } | { status: 'unavailable'; messageKey: string }

function messageKeyForStatus(status: number): string {
  switch (status) {
    case 409:
      return 'torrents.preview_data_unavailable'
    case 503:
      return 'torrents.preview_too_many_streams'
    default:
      return 'torrents.preview_failed'
  }
}

// The stream endpoint can fail for reasons that have nothing to do with codec support
// (piece data not saved, too many concurrent previews, ...). A cheap ranged preflight lets
// us surface that distinction instead of always showing a generic "couldn't be played".
function useStreamAvailability(url: string): Availability {
  const [state, setState] = useState<Availability>({ status: 'checking' })

  useEffect(() => {
    let cancelled = false

    fetch(url, { headers: { Range: 'bytes=0-0' } })
      .then((res) => {
        if (cancelled) return
        setState(res.ok ? { status: 'ready' } : { status: 'unavailable', messageKey: messageKeyForStatus(res.status) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unavailable', messageKey: 'torrents.preview_failed' })
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return state
}

function MediaPreviewBody({ node, url }: { node: PreviewableNode; url: string }) {
  const { t } = useTranslation()
  const [playbackFailed, setPlaybackFailed] = useState(false)
  const availability = useStreamAvailability(url)

  if (availability.status === 'checking') {
    return (
      <div className="w-full py-8 text-center text-sm text-muted-fg">
        <div className="mb-3 h-0.5 w-full animate-pulse bg-primary" />
        {t('torrents.preview_loading')}
      </div>
    )
  }

  if (availability.status === 'unavailable') {
    return <p className="py-8 text-sm text-muted-fg">{t(availability.messageKey)}</p>
  }

  if (playbackFailed) {
    return <p className="py-8 text-sm text-muted-fg">{t('torrents.preview_failed')}</p>
  }

  if (node.fileType === 'image') {
    return (
      <img
        src={url}
        alt={node.name}
        className="max-h-[70vh] w-full object-contain"
        onError={() => setPlaybackFailed(true)}
      />
    )
  }

  if (node.fileType === 'audio') {
    return <audio controls autoPlay src={url} className="w-full" onError={() => setPlaybackFailed(true)} />
  }

  return <video controls autoPlay src={url} className="max-h-[70vh] w-full" onError={() => setPlaybackFailed(true)} />
}

export function MediaPreviewModal({
  infoHash,
  node,
  onOpenChange,
}: {
  infoHash: string
  node: PreviewableNode | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={node != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {node && (
          <>
            <DialogHeader>
              <DialogTitle className="truncate">{node.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <MediaPreviewBody key={node.index} node={node} url={resolveTorrentFileStreamUrl(infoHash, node.index)} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
