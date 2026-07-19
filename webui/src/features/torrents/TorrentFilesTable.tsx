import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client/react'
import { Paginator } from '@/components/ui/paginator'
import { formatFilesize } from '@/lib/utils/filesize'
import { addError } from '@/lib/toast/store'
import { TorrentFilesDocument, type TorrentFragment } from '@/lib/graphql/generated'

const defaultLimit = 10

export function TorrentFilesTable({ torrent }: { torrent: TorrentFragment }) {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(defaultLimit)

  const isSingle = torrent.filesStatus === 'single'

  const { data, loading, error } = useQuery(TorrentFilesDocument, {
    variables: { input: { infoHashes: [torrent.infoHash], limit, page, totalCount: true, hasNextPage: false } },
    skip: isSingle,
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (error) addError(`Error loading item results: ${error.message}`)
  }, [error])

  const items = isSingle
    ? [
        {
          infoHash: torrent.infoHash,
          index: 0,
          path: torrent.name,
          size: torrent.size,
          fileType: torrent.fileType,
        },
      ]
    : (data?.torrent?.files?.items ?? [])
  const totalCount = isSingle ? 1 : (data?.torrent?.files?.totalCount ?? 0)

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
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted-fg">
            <th className="py-1 font-medium">{t('torrents.file_index')}</th>
            <th className="py-1 font-medium">{t('torrents.file_path')}</th>
            <th className="py-1 font-medium">{t('torrents.file_type')}</th>
            <th className="py-1 font-medium">{t('torrents.file_size')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((file) => (
            <tr key={file.index} className="border-t border-border">
              <td className="py-1.5">{file.index}</td>
              <td className="py-1.5">{file.path}</td>
              <td className="py-1.5">{t(`file_types.${file.fileType ?? 'unknown'}`)}</td>
              <td className="py-1.5" title={formatFilesize(file.size, i18n.language, 10)}>
                {formatFilesize(file.size, i18n.language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!isSingle && totalCount > 10 && (
        <Paginator
          page={page}
          pageSize={limit}
          pageLength={items.length}
          totalLength={totalCount}
          showLastPage
          onPaging={(e) => {
            setPage(e.page)
            setLimit(e.pageSize)
          }}
        />
      )}
    </div>
  )
}
