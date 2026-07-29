import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronDown, Folder, FolderOpen, File as FileIcon } from 'lucide-react'
import { formatFilesize } from '@/lib/utils/filesize'
import { isNodeExpanded, type TreeFileNode, type TreeFolderNode } from './fileTree'
import { FILE_TYPE_ICONS, isExpandableArchive, isPreviewable } from './treeFileTypes'

export function FileRow<TMeta>({
  node,
  depth,
  onPreview,
  archiveExpansion,
}: {
  node: TreeFileNode<TMeta>
  depth: number
  onPreview: (node: TreeFileNode<TMeta>) => void
  // Present only for a top-level archive file - lets this row toggle open/closed like a
  // folder instead of (or in addition to) previewing, since an archive file itself is
  // never directly previewable.
  archiveExpansion?: { expanded: boolean; onToggle: () => void }
}) {
  const { t, i18n } = useTranslation()
  const previewable = isPreviewable(node.fileType, node.name)
  const expandable = archiveExpansion != null && isExpandableArchive(node.fileType)
  const TypeIcon = (node.fileType && FILE_TYPE_ICONS[node.fileType]) ?? FileIcon

  const content = (
    <>
      {expandable &&
        (archiveExpansion.expanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-fg" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-fg" />
        ))}
      <TypeIcon className={`size-4 shrink-0 ${previewable ? 'text-primary' : 'text-muted-fg'}`} />
      <span className="flex-1 truncate">{node.name}</span>
      <span className="w-20 shrink-0 text-xs text-muted-fg">{t(`file_types.${node.fileType ?? 'unknown'}`)}</span>
      <span className="w-20 shrink-0 text-right text-xs text-muted-fg">{formatFilesize(node.size, i18n.language)}</span>
    </>
  )

  if (expandable) {
    return (
      <button
        type="button"
        onClick={archiveExpansion.onToggle}
        className="flex w-full items-center gap-2 rounded py-1 text-left text-sm hover:bg-surface-hover"
        style={{ paddingLeft: depth * 20 }}
        title={t('torrents.browse_archive')}
      >
        {content}
      </button>
    )
  }

  if (previewable) {
    return (
      <button
        type="button"
        onClick={() => onPreview(node)}
        className="flex w-full items-center gap-2 rounded py-1 text-left text-sm hover:bg-surface-hover"
        style={{ paddingLeft: depth * 20 + 4 }}
        title={t('torrents.preview_file')}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1 text-sm" style={{ paddingLeft: depth * 20 + 4 }}>
      {content}
    </div>
  )
}

export function FolderRow<TMeta>({
  node,
  depth,
  toggled,
  onToggle,
}: {
  node: TreeFolderNode<TMeta>
  depth: number
  toggled: Set<string>
  onToggle: (path: string) => void
}) {
  const { t, i18n } = useTranslation()
  const isExpanded = isNodeExpanded(node.path, toggled)

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded py-1 text-left text-sm hover:bg-surface-hover"
      style={{ paddingLeft: depth * 20 }}
      onClick={() => onToggle(node.path)}
    >
      {isExpanded ? (
        <ChevronDown className="size-4 shrink-0 text-muted-fg" />
      ) : (
        <ChevronRight className="size-4 shrink-0 text-muted-fg" />
      )}
      {isExpanded ? (
        <FolderOpen className="size-4 shrink-0 text-muted-fg" />
      ) : (
        <Folder className="size-4 shrink-0 text-muted-fg" />
      )}
      <span className="flex-1 truncate font-medium">{node.name}</span>
      <span className="w-20 shrink-0 text-right text-xs text-muted-fg">
        {t('torrents.files_count_n', { count: node.fileCount })}
      </span>
      <span className="w-20 shrink-0 text-right text-xs text-muted-fg">{formatFilesize(node.size, i18n.language)}</span>
    </button>
  )
}
