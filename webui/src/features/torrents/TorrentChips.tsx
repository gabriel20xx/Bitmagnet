import { useTranslation } from 'react-i18next'
import { Tag, Languages, Ratio, Album, Binary } from 'lucide-react'
import type { TorrentContentFragment } from '@/lib/graphql/generated'
import { cn } from '@/lib/utils/cn'

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function TorrentChips({ torrentContent }: { torrentContent: TorrentContentFragment }) {
  const { t } = useTranslation()
  const videoResolution = torrentContent.videoResolution?.slice(1)

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {torrentContent.torrent.tagNames.map((tagName) => (
        <Chip key={tagName} className="border-primary/40 text-primary">
          <Tag className="size-3" />
          {tagName}
        </Chip>
      ))}
      {!!torrentContent.languages?.length && (
        <Chip>
          <Languages className="size-3" />
          {torrentContent.languages.map((l) => t(`languages.${l.id}`)).join(', ')}
        </Chip>
      )}
      {torrentContent.video3d?.slice(1) && <Chip>{torrentContent.video3d.slice(1)}</Chip>}
      {videoResolution && (
        <Chip>
          <Ratio className="size-3" />
          {videoResolution}
        </Chip>
      )}
      {torrentContent.videoSource && (
        <Chip>
          <Album className="size-3" />
          {torrentContent.videoSource}
        </Chip>
      )}
      {torrentContent.videoCodec && (
        <Chip>
          <Binary className="size-3" />
          {torrentContent.videoCodec}
        </Chip>
      )}
      {torrentContent.videoModifier && <Chip>{torrentContent.videoModifier}</Chip>}
    </div>
  )
}
