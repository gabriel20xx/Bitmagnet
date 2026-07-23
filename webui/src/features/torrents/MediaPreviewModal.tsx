import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { resolveTorrentFileStreamUrl } from '@/lib/graphql/endpoint'
import type { FileType } from '@/lib/graphql/generated'

interface PreviewableNode {
  name: string
  index: number
  fileType: FileType | null
}

function MediaPreviewBody({ node, url }: { node: PreviewableNode; url: string }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <p className="py-8 text-sm text-muted-fg">{t('torrents.preview_failed')}</p>
  }

  if (node.fileType === 'image') {
    return (
      <img src={url} alt={node.name} className="max-h-[70vh] w-full object-contain" onError={() => setFailed(true)} />
    )
  }

  if (node.fileType === 'audio') {
    return <audio controls autoPlay src={url} className="w-full" onError={() => setFailed(true)} />
  }

  return <video controls autoPlay src={url} className="max-h-[70vh] w-full" onError={() => setFailed(true)} />
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
