import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client/react'
import { addError } from '@/lib/toast/store'
import { Paginator, type PageEvent } from '@/components/ui/paginator'
import { resolveTorrentFileStreamUrl } from '@/lib/graphql/endpoint'
import { TorrentFilesDocument, type TorrentFragment } from '@/lib/graphql/generated'
import { buildTree, flattenVisibleRows, isNodeExpanded, type TreeFileNode } from './fileTree'
import { FileRow, FolderRow } from './TreeRows'
import { isExpandableArchive } from './treeFileTypes'
import { ArchiveContents } from './ArchiveContents'
import { MediaPreviewModal, type PreviewTarget } from './MediaPreviewModal'

const DEFAULT_ROWS_PAGING: PageEvent = { page: 1, pageSize: 50 }

export function TorrentFilesTree({ torrent }: { torrent: TorrentFragment }) {
  const { t, i18n } = useTranslation()
  const isSingle = torrent.filesStatus === 'single'

  const { data, error } = useQuery(TorrentFilesDocument, {
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
    return buildTree(files.map((f) => ({ path: f.path, size: f.size, fileType: f.fileType, meta: f.index })))
  }, [isSingle, torrent.name, torrent.size, torrent.fileType, items])

  const [toggled, setToggled] = useState<Set<string>>(new Set())
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null)
  const [rowsPaging, setRowsPaging] = useState<PageEvent>(DEFAULT_ROWS_PAGING)

  const toggle = (path: string) => {
    setToggled((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const visibleRows = useMemo(() => flattenVisibleRows(tree.children, 0, toggled), [tree, toggled])

  // Expanding/collapsing a folder changes how many rows there are to page through, so the
  // previous page position is no longer meaningful once that happens.
  useEffect(() => {
    setRowsPaging((p) => ({ ...p, page: 1 }))
  }, [tree, toggled])

  const rowsStart = (rowsPaging.page - 1) * rowsPaging.pageSize
  const pageRows = visibleRows.slice(rowsStart, rowsStart + rowsPaging.pageSize)

  const previewOuterFile = (node: TreeFileNode<number>) => {
    setPreviewTarget({
      name: node.name,
      fileType: node.fileType,
      url: resolveTorrentFileStreamUrl(torrent.infoHash, node.meta),
    })
  }

  return (
    <div>
      {torrent.filesStatus === 'over_threshold' && (
        <p className="mb-2 text-sm text-muted-fg">
          {t('torrents.showing_x_of_y_files', {
            x: totalCount.toLocaleString(i18n.language),
            y: torrent.filesCount == null ? '?' : torrent.filesCount.toLocaleString(i18n.language),
          })}
        </p>
      )}
      <div>
        {pageRows.map(({ node, depth }) => (
          <Fragment key={node.path}>
            {node.kind === 'folder' ? (
              <FolderRow node={node} depth={depth} toggled={toggled} onToggle={toggle} />
            ) : (
              <FileRow
                node={node}
                depth={depth}
                onPreview={previewOuterFile}
                archiveExpansion={
                  isExpandableArchive(node.fileType)
                    ? { expanded: isNodeExpanded(node.path, toggled), onToggle: () => toggle(node.path) }
                    : undefined
                }
              />
            )}
            {node.kind === 'file' && isExpandableArchive(node.fileType) && isNodeExpanded(node.path, toggled) && (
              <ArchiveContents
                infoHash={torrent.infoHash}
                fileIndex={node.meta}
                depth={depth + 1}
                onPreview={setPreviewTarget}
              />
            )}
          </Fragment>
        ))}
      </div>
      {visibleRows.length > rowsPaging.pageSize && (
        <Paginator
          page={rowsPaging.page}
          pageSize={rowsPaging.pageSize}
          pageLength={pageRows.length}
          totalLength={visibleRows.length}
          onPaging={setRowsPaging}
        />
      )}
      <MediaPreviewModal
        target={previewTarget}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null)
        }}
      />
    </div>
  )
}
