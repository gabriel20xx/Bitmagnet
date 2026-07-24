import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { resolveTorrentFileStreamUrl } from '@/lib/graphql/endpoint'
import { isTextPreviewable } from '@/lib/utils/textPreview'
import type { FileType } from '@/lib/graphql/generated'

// Fetched as a ranged request so a huge file misclassified as text can't hang the tab.
const TEXT_PREVIEW_BYTE_LIMIT = 500_000

type TextPreviewState = { text: string; truncated: boolean }

function useTextPreview(url: string, onError: () => void): TextPreviewState | null {
  const [state, setState] = useState<TextPreviewState | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(url, { headers: { Range: `bytes=0-${TEXT_PREVIEW_BYTE_LIMIT - 1}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error('failed to load text preview')

        const text = await res.text()
        const total = Number(res.headers.get('Content-Range')?.split('/')[1])
        if (!cancelled) setState({ text, truncated: Number.isFinite(total) && total > TEXT_PREVIEW_BYTE_LIMIT })
      })
      .catch(() => {
        if (!cancelled) onError()
      })

    return () => {
      cancelled = true
    }
  }, [url, onError])

  return state
}

function TextPreview({ url, onError }: { url: string; onError: () => void }) {
  const { t } = useTranslation()
  const state = useTextPreview(url, onError)

  if (!state) return null

  return (
    <div className="flex h-full w-full flex-col text-left">
      <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded bg-surface p-4 text-sm">
        {state.text}
      </pre>
      {state.truncated && <p className="mt-2 text-xs text-muted-fg">{t('torrents.preview_truncated')}</p>}
    </div>
  )
}

interface PreviewableNode {
  name: string
  index: number
  fileType: FileType | null
}

type Availability = { status: 'checking' } | { status: 'ready' } | { status: 'unavailable'; messageKey: string }

function messageKeyForStatus(status: number): string {
  switch (status) {
    case 503:
      return 'torrents.preview_too_many_streams'
    case 504:
      return 'torrents.preview_no_peers'
    default:
      return 'torrents.preview_failed'
  }
}

// The stream endpoint can fail for reasons that have nothing to do with codec support
// (too many concurrent previews, no peers found the data in time, ...). A cheap ranged
// preflight lets us surface that distinction instead of always showing a generic "couldn't
// be played".
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
  const handlePlaybackError = useCallback(() => setPlaybackFailed(true), [])
  const availability = useStreamAvailability(url)

  if (availability.status === 'checking') {
    return (
      <div className="w-full max-w-sm text-center text-sm text-muted-fg">
        <div className="mb-3 h-0.5 w-full animate-pulse bg-primary" />
        {t('torrents.preview_loading')}
      </div>
    )
  }

  if (availability.status === 'unavailable') {
    return <p className="text-sm text-muted-fg">{t(availability.messageKey)}</p>
  }

  if (playbackFailed) {
    return <p className="text-sm text-muted-fg">{t('torrents.preview_failed')}</p>
  }

  if (isTextPreviewable(node.name)) {
    return <TextPreview url={url} onError={handlePlaybackError} />
  }

  if (node.fileType === 'image') {
    return (
      <img
        src={url}
        alt={node.name}
        className="h-full max-h-full w-full object-contain"
        onError={() => setPlaybackFailed(true)}
      />
    )
  }

  if (node.fileType === 'audio') {
    return <audio controls autoPlay src={url} className="w-full" onError={() => setPlaybackFailed(true)} />
  }

  return (
    <video
      controls
      autoPlay
      src={url}
      className="h-full max-h-full w-full object-contain"
      onError={() => setPlaybackFailed(true)}
    />
  )
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
      <DialogContent className="max-w-6xl">
        {node && (
          <>
            <DialogHeader>
              <DialogTitle className="truncate">{node.name}</DialogTitle>
            </DialogHeader>
            <div className="flex h-[80vh] items-center justify-center overflow-hidden">
              <MediaPreviewBody key={node.index} node={node} url={resolveTorrentFileStreamUrl(infoHash, node.index)} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
