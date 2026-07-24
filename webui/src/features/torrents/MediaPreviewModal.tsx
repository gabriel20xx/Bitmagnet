import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoaderCircle, RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
function useStreamAvailability(url: string, retryKey: number): Availability {
  const [state, setState] = useState<Availability>({ status: 'checking' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'checking' })

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
  }, [url, retryKey])

  return state
}

function PreviewLoading() {
  const { t } = useTranslation()

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center text-sm text-muted-fg">
      <LoaderCircle className="size-8 animate-spin text-primary" />
      {t('torrents.preview_loading')}
    </div>
  )
}

function RetryablePreviewMessage({ messageKey, onRetry }: { messageKey: string; onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-fg">{t(messageKey)}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw className="size-4" />
        {t('general.try_again')}
      </Button>
    </div>
  )
}

function MediaPreviewBody({ node, url }: { node: PreviewableNode; url: string }) {
  const [playbackFailed, setPlaybackFailed] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const handlePlaybackError = useCallback(() => setPlaybackFailed(true), [])
  const availability = useStreamAvailability(url, retryKey)

  const retry = () => {
    setPlaybackFailed(false)
    setRetryKey((k) => k + 1)
  }

  if (availability.status === 'checking') {
    return <PreviewLoading />
  }

  if (availability.status === 'unavailable') {
    return <RetryablePreviewMessage messageKey={availability.messageKey} onRetry={retry} />
  }

  if (playbackFailed) {
    return <RetryablePreviewMessage messageKey="torrents.preview_failed" onRetry={retry} />
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
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-black/5 dark:bg-white/5">
              <MediaPreviewBody key={node.index} node={node} url={resolveTorrentFileStreamUrl(infoHash, node.index)} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
