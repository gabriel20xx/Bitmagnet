import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client/react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File as FileIcon,
  Archive,
  Database,
  FileText,
  Image,
  Monitor,
  Music,
  Subtitles,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { formatFilesize } from '@/lib/utils/filesize'
import { addError } from '@/lib/toast/store'
import { isTextPreviewable } from '@/lib/utils/textPreview'
import { TorrentFilesDocument, type FileType, type TorrentFragment } from '@/lib/graphql/generated'
import { MediaPreviewModal } from './MediaPreviewModal'

const PREVIEWABLE_FILE_TYPES: readonly FileType[] = ['image', 'audio', 'video']

function isPreviewable(fileType: FileType | null, name: string): boolean {
  return (fileType != null && PREVIEWABLE_FILE_TYPES.includes(fileType)) || isTextPreviewable(name)
}

const FILE_TYPE_ICONS: Partial<Record<FileType, LucideIcon>> = {
  archive: Archive,
  audio: Music,
  data: Database,
  document: FileText,
  image: Image,
  software: Monitor,
  subtitles: Subtitles,
  video: Video,
}

interface FileNode {
  kind: 'file'
  name: string
  path: string
  index: number
  size: number
  fileType: FileType | null
}

interface FolderNode {
  kind: 'folder'
  name: string
  path: string
  size: number
  fileCount: number
  children: TreeNode[]
}

type TreeNode = FileNode | FolderNode

function buildTree(
  files: readonly { path: string; size: number; fileType: FileType | null; index: number }[],
): FolderNode {
  const root: FolderNode = { kind: 'folder', name: '', path: '', size: 0, fileCount: 0, children: [] }
  const folders = new Map<string, FolderNode>([['', root]])

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean)
    const fileName = parts.pop() ?? file.path
    let parentPath = ''
    let parent = root
    for (const part of parts) {
      const currentPath = parentPath ? `${parentPath}/${part}` : part
      let folder = folders.get(currentPath)
      if (!folder) {
        folder = { kind: 'folder', name: part, path: currentPath, size: 0, fileCount: 0, children: [] }
        folders.set(currentPath, folder)
        parent.children.push(folder)
      }
      parent = folder
      parentPath = currentPath
    }
    parent.children.push({
      kind: 'file',
      name: fileName,
      path: file.path,
      index: file.index,
      size: file.size,
      fileType: file.fileType,
    })
  }

  const aggregate = (folder: FolderNode): void => {
    let size = 0
    let fileCount = 0
    for (const child of folder.children) {
      if (child.kind === 'file') {
        size += child.size
        fileCount += 1
      } else {
        aggregate(child)
        size += child.size
        fileCount += child.fileCount
      }
    }
    folder.size = size
    folder.fileCount = fileCount
    folder.children.sort((a, b) => (a.kind !== b.kind ? (a.kind === 'folder' ? -1 : 1) : a.name.localeCompare(b.name)))
  }
  aggregate(root)

  return root
}

// Root-level folders are expanded by default; deeper folders are collapsed by default.
// `toggled` records paths whose expansion differs from that default, so no reset is needed on data reload.
function isNodeExpanded(path: string, depth: number, toggled: Set<string>): boolean {
  const defaultExpanded = depth === 0
  return toggled.has(path) ? !defaultExpanded : defaultExpanded
}

function FileRow({ node, depth, onPreview }: { node: FileNode; depth: number; onPreview: (node: FileNode) => void }) {
  const { t, i18n } = useTranslation()
  const previewable = isPreviewable(node.fileType, node.name)
  const TypeIcon = (node.fileType && FILE_TYPE_ICONS[node.fileType]) ?? FileIcon
  const content = (
    <>
      <TypeIcon className={`size-4 shrink-0 ${previewable ? 'text-primary' : 'text-muted-fg'}`} />
      <span className="flex-1 truncate">{node.name}</span>
      <span className="w-20 shrink-0 text-xs text-muted-fg">{t(`file_types.${node.fileType ?? 'unknown'}`)}</span>
      <span
        className="w-20 shrink-0 text-right text-xs text-muted-fg"
        title={formatFilesize(node.size, i18n.language, 10)}
      >
        {formatFilesize(node.size, i18n.language)}
      </span>
    </>
  )

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

function FolderRow({
  node,
  depth,
  toggled,
  onToggle,
  onPreview,
}: {
  node: FolderNode
  depth: number
  toggled: Set<string>
  onToggle: (path: string) => void
  onPreview: (node: FileNode) => void
}) {
  const { t, i18n } = useTranslation()
  const isExpanded = isNodeExpanded(node.path, depth, toggled)

  return (
    <div>
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
        <span
          className="w-20 shrink-0 text-right text-xs text-muted-fg"
          title={formatFilesize(node.size, i18n.language, 10)}
        >
          {formatFilesize(node.size, i18n.language)}
        </span>
      </button>
      {isExpanded &&
        node.children.map((child) =>
          child.kind === 'folder' ? (
            <FolderRow
              key={child.path}
              node={child}
              depth={depth + 1}
              toggled={toggled}
              onToggle={onToggle}
              onPreview={onPreview}
            />
          ) : (
            <FileRow key={child.path} node={child} depth={depth + 1} onPreview={onPreview} />
          ),
        )}
    </div>
  )
}

export function TorrentFilesTree({ torrent }: { torrent: TorrentFragment }) {
  const { t, i18n } = useTranslation()
  const isSingle = torrent.filesStatus === 'single'

  const { data, loading, error } = useQuery(TorrentFilesDocument, {
    variables: {
      input: {
        infoHashes: [torrent.infoHash],
        limit: torrent.filesCount ?? 10000,
        totalCount: true,
        hasNextPage: false,
        orderBy: [{ field: 'path' }],
      },
    },
    skip: isSingle,
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (error) addError(`Error loading item results: ${error.message}`)
  }, [error])

  const items = data?.torrent?.files?.items
  const totalCount = isSingle ? 1 : (data?.torrent?.files?.totalCount ?? 0)

  const tree = useMemo(() => {
    const files = isSingle
      ? [{ path: torrent.name, size: torrent.size, fileType: torrent.fileType, index: 0 }]
      : (items ?? [])
    return buildTree(files)
  }, [isSingle, torrent.name, torrent.size, torrent.fileType, items])

  const [toggled, setToggled] = useState<Set<string>>(new Set())
  const [previewNode, setPreviewNode] = useState<FileNode | null>(null)

  const toggle = (path: string) => {
    setToggled((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div>
      {!isSingle && loading && <div className="h-0.5 w-full animate-pulse bg-primary" />}
      {torrent.filesStatus === 'over_threshold' && (
        <p className="mb-2 text-sm text-muted-fg">
          {t('torrents.showing_x_of_y_files', {
            x: totalCount.toLocaleString(i18n.language),
            y: torrent.filesCount == null ? '?' : torrent.filesCount.toLocaleString(i18n.language),
          })}
        </p>
      )}
      <div>
        {tree.children.map((child) =>
          child.kind === 'folder' ? (
            <FolderRow
              key={child.path}
              node={child}
              depth={0}
              toggled={toggled}
              onToggle={toggle}
              onPreview={setPreviewNode}
            />
          ) : (
            <FileRow key={child.path} node={child} depth={0} onPreview={setPreviewNode} />
          ),
        )}
      </div>
      <MediaPreviewModal
        infoHash={torrent.infoHash}
        node={previewNode}
        onOpenChange={(open) => {
          if (!open) setPreviewNode(null)
        }}
      />
    </div>
  )
}
