import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Magnet, Download, HelpCircle, Copy } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { formatFilesize } from '@/lib/utils/filesize'
import { formatTimeAgo } from '@/lib/dates/format'
import { resolveTorrentDownloadUrl } from '@/lib/graphql/endpoint'
import { TorrentSendIcon } from '@/features/integrations/TorrentSendIcon'
import type { TorrentContentFragment } from '@/lib/graphql/generated'
import { contentTypeInfo } from './contentTypes'
import { TorrentChips } from './TorrentChips'
import { TorrentDuplicatesRow } from './TorrentDuplicatesRow'
import { TorrentFilesTree } from './TorrentFilesTree'
import type { TorrentSearchControls } from './searchControls'

export const allColumns = ['select', 'summary', 'size', 'publishedAt', 'peers', 'magnet'] as const
export const compactColumns = ['select', 'summary', 'size', 'magnet'] as const
export type Column = (typeof allColumns)[number]

export function TorrentsTable({
  items,
  controls,
  displayedColumns,
  selected,
  onToggleSelected,
  onToggleAll,
  onSelectControls,
}: {
  items: TorrentContentFragment[]
  controls: TorrentSearchControls
  displayedColumns: readonly Column[]
  selected: Set<string>
  onToggleSelected: (infoHash: string) => void
  onToggleAll: () => void
  onSelectControls: (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void
}) {
  const { t, i18n } = useTranslation()
  const isAllSelected = items.length > 0 && items.every((i) => selected.has(i.infoHash))
  const isIndeterminate = !isAllSelected && items.some((i) => selected.has(i.infoHash))
  const [expandedDuplicatesOf, setExpandedDuplicatesOf] = useState<string | null>(null)

  const toggleSelectedTorrent = (infoHash: string) => {
    onSelectControls((c) => ({
      ...c,
      selectedTorrent: c.selectedTorrent?.infoHash === infoHash ? undefined : { infoHash },
    }))
  }

  return (
    <div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted-fg">
            {displayedColumns.includes('select') && (
              <th className="w-8 py-2 text-center">
                <SimpleTooltip label={isAllSelected ? t('torrents.deselect_all') : t('torrents.select_all')}>
                  <Checkbox
                    className="mx-auto"
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onCheckedChange={onToggleAll}
                  />
                </SimpleTooltip>
              </th>
            )}
            {displayedColumns.includes('summary') && <th className="py-2 font-medium">{t('torrents.summary')}</th>}
            {displayedColumns.includes('size') && <th className="py-2 font-medium">{t('torrents.size')}</th>}
            {displayedColumns.includes('publishedAt') && (
              <th className="py-2 font-medium">{t('torrents.published')}</th>
            )}
            {displayedColumns.includes('peers') && (
              <th className="py-2 font-medium">
                <SimpleTooltip label={`${t('torrents.seeders')} / ${t('torrents.leechers')}`}>
                  <abbr>{t('torrents.s_l')}</abbr>
                </SimpleTooltip>
              </th>
            )}
            {displayedColumns.includes('magnet') && (
              <th className="py-2 text-center font-medium">{t('torrents.download')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const ContentTypeIcon = contentTypeInfo(item.contentType)?.icon ?? HelpCircle
            const expanded = controls.selectedTorrent?.infoHash === item.infoHash
            return (
              <Fragment key={item.infoHash}>
                <tr
                  onClick={() => toggleSelectedTorrent(item.infoHash)}
                  className={
                    'cursor-pointer border-t border-border hover:bg-surface-hover ' +
                    (expanded ? 'bg-surface-hover' : '')
                  }
                >
                  {displayedColumns.includes('select') && (
                    <td className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        className="mx-auto"
                        checked={selected.has(item.infoHash)}
                        onCheckedChange={() => onToggleSelected(item.infoHash)}
                      />
                    </td>
                  )}
                  {displayedColumns.includes('summary') && (
                    <td className="max-w-md py-2">
                      <div className="flex items-center gap-2">
                        <SimpleTooltip label={t(`content_types.singular.${item.contentType ?? 'null'}`)}>
                          <ContentTypeIcon className="size-4 shrink-0" />
                        </SimpleTooltip>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.title}</div>
                          {item.title !== item.torrent.name && (
                            <p className="truncate text-xs text-muted-fg">{item.torrent.name}</p>
                          )}
                          <TorrentChips torrentContent={item} />
                          {item.duplicatesCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedDuplicatesOf((prev) => (prev === item.infoHash ? null : item.infoHash))
                              }}
                              className="mt-1 flex items-center gap-1 text-xs text-muted-fg hover:text-primary hover:underline"
                            >
                              <Copy className="size-3" />
                              {t('torrents.duplicates_count_n', { count: item.duplicatesCount })}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {displayedColumns.includes('size') && (
                    <td className="py-2">
                      <span title={formatFilesize(item.torrent.size, i18n.language, 10)}>
                        {formatFilesize(item.torrent.size, i18n.language)}
                      </span>
                    </td>
                  )}
                  {displayedColumns.includes('publishedAt') && (
                    <td className="py-2">
                      <abbr title={item.publishedAt}>{formatTimeAgo(item.publishedAt, i18n.language)}</abbr>
                    </td>
                  )}
                  {displayedColumns.includes('peers') && (
                    <td className="py-2">
                      {item.seeders ?? '?'} / {item.leechers ?? '?'}
                    </td>
                  )}
                  {displayedColumns.includes('magnet') && (
                    <td className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <TorrentSendIcon infoHash={item.infoHash} />
                        <SimpleTooltip label={t('torrents.magnet')}>
                          <a href={item.torrent.magnetUri} className="cursor-pointer">
                            <Magnet className="size-4 text-primary" />
                          </a>
                        </SimpleTooltip>
                        <SimpleTooltip label={t('torrents.download_torrent_file')}>
                          <a href={resolveTorrentDownloadUrl(item.infoHash)} className="cursor-pointer">
                            <Download className="size-4 text-primary" />
                          </a>
                        </SimpleTooltip>
                      </div>
                    </td>
                  )}
                </tr>
                {expanded && (
                  <tr className="border-t border-border bg-surface/50">
                    <td colSpan={displayedColumns.length} className="p-4">
                      <TorrentFilesTree torrent={item.torrent} />
                    </td>
                  </tr>
                )}
                {expandedDuplicatesOf === item.infoHash && (
                  <TorrentDuplicatesRow infoHash={item.infoHash} colSpan={displayedColumns.length} />
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
