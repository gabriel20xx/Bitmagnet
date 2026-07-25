import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoaderCircle } from 'lucide-react'
import { resolveTorrentArchiveEntryStreamUrl } from '@/lib/graphql/endpoint'
import { buildTree, flattenVisibleRows, type TreeFileNode } from './fileTree'
import { useArchiveEntries } from './useArchiveEntries'
import { FileRow, FolderRow } from './TreeRows'
import type { PreviewTarget } from './MediaPreviewModal'

// The contents of one archive file, fetched lazily (only once its row is expanded) and
// rendered directly beneath it - mirrors the outer file list's tree/toggle behavior, but
// kept as its own small, self-contained tree rather than merged into the outer one, since
// archives are expected to have far fewer entries than a whole torrent's file list (the
// backend caps how many it will list at all) and don't need their own pagination.
export function ArchiveContents({
  infoHash,
  fileIndex,
  depth,
  onPreview,
}: {
  infoHash: string
  fileIndex: number
  depth: number
  onPreview: (target: PreviewTarget) => void
}) {
  const { t } = useTranslation()
  const { entries, loading, error } = useArchiveEntries(infoHash, fileIndex, true)
  const [toggled, setToggled] = useState<Set<string>>(new Set())

  const tree = useMemo(
    () => buildTree(entries.map((e) => ({ path: e.path, size: e.size, fileType: e.fileType, meta: e.index }))),
    [entries],
  )

  const visibleRows = useMemo(() => flattenVisibleRows(tree.children, depth, toggled), [tree, depth, toggled])

  const toggle = (path: string) => {
    setToggled((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const previewEntry = (node: TreeFileNode<number>) => {
    onPreview({
      name: node.name,
      fileType: node.fileType,
      url: resolveTorrentArchiveEntryStreamUrl(infoHash, fileIndex, node.meta),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-muted-fg" style={{ paddingLeft: depth * 20 + 4 }}>
        <LoaderCircle className="size-4 animate-spin" />
        {t('torrents.preview_loading')}
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-1 text-sm text-danger" style={{ paddingLeft: depth * 20 + 4 }}>
        {error.message}
      </p>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="py-1 text-sm text-muted-fg" style={{ paddingLeft: depth * 20 + 4 }}>
        {t('torrents.archive_empty')}
      </p>
    )
  }

  return (
    <div>
      {visibleRows.map(({ node, depth: rowDepth }) =>
        node.kind === 'folder' ? (
          <FolderRow key={node.path} node={node} depth={rowDepth} toggled={toggled} onToggle={toggle} />
        ) : (
          <FileRow key={node.path} node={node} depth={rowDepth} onPreview={previewEntry} />
        ),
      )}
    </div>
  )
}
