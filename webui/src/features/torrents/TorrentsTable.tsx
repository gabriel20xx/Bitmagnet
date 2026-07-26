import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Magnet, Download, Fingerprint, Check, HelpCircle, Copy } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { formatFilesize } from '@/lib/utils/filesize'
import { formatTimeAgo } from '@/lib/dates/format'
import { resolveTorrentDownloadUrl } from '@/lib/graphql/endpoint'
import { useCopyFeedback } from '@/lib/hooks/useCopyFeedback'
import { TorrentSendIcon } from '@/features/integrations/TorrentSendIcon'
import type { TorrentContentFragment } from '@/lib/graphql/generated'
import { contentTypeInfo } from './contentTypes'
import { FavoritesPicker } from './FavoritesPicker'
import { SeedersLeechers } from './SeedersLeechers'
import { TorrentChips } from './TorrentChips'
import { TorrentDuplicatesRow } from './TorrentDuplicatesRow'
import { TorrentFilesTree } from './TorrentFilesTree'
import type { TorrentSearchControls } from './searchControls'

export const allColumns = ['select', 'summary', 'size', 'publishedAt', 'peers', 'magnet'] as const
export const compactColumns = ['select', 'summary', 'size', 'magnet'] as const
export type Column = (typeof allColumns)[number]

function TorrentRow({
  item,
  displayedColumns,
  expanded,
  expandedDuplicates,
  isSelected,
  onToggleSelected,
  onRowClick,
  onToggleDuplicates,
  favoritesListId,
  onAssignFavorite,
  onRemoveFavorite,
}: {
  item: TorrentContentFragment
  displayedColumns: readonly Column[]
  expanded: boolean
  expandedDuplicates: boolean
  isSelected: boolean
  onToggleSelected: () => void
  onRowClick: () => void
  onToggleDuplicates: () => void
  favoritesListId: string | null
  onAssignFavorite: (listId: string) => void
  onRemoveFavorite: () => void
}) {
  const { t, i18n } = useTranslation()
  const ContentTypeIcon = contentTypeInfo(item.contentType)?.icon ?? HelpCircle
  const [magnetCopied, copyMagnet] = useCopyFeedback()
  const [infoHashCopied, copyInfoHash] = useCopyFeedback()

  return (
    <Fragment>
      <tr
        onClick={onRowClick}
        className={
          'cursor-pointer border-t border-border hover:bg-surface-hover ' + (expanded ? 'bg-surface-hover' : '')
        }
      >
        {displayedColumns.includes('select') && (
          <td className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox className="mx-auto" checked={isSelected} onCheckedChange={onToggleSelected} />
          </td>
        )}
        {displayedColumns.includes('summary') && (
          <td className="max-w-md py-2">
            <div className="flex items-start gap-2">
              <SimpleTooltip label={t(`content_types.singular.${item.contentType ?? 'null'}`)}>
                <ContentTypeIcon className="mt-0.5 size-4 shrink-0" />
              </SimpleTooltip>
              <div className="min-w-0">
                <div className="truncate font-medium leading-4">{item.title}</div>
                {item.title !== item.torrent.name && (
                  <p className="truncate text-xs text-muted-fg">{item.torrent.name}</p>
                )}
                <TorrentChips torrentContent={item} />
                {item.duplicatesCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleDuplicates()
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
            <SeedersLeechers seeders={item.seeders} leechers={item.leechers} />
          </td>
        )}
        {displayedColumns.includes('magnet') && (
          <td className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-2">
              <FavoritesPicker
                favoritesListId={favoritesListId}
                onAssign={onAssignFavorite}
                onRemove={onRemoveFavorite}
              />
              <TorrentSendIcon infoHash={item.infoHash} />
              <SimpleTooltip label={t('torrents.copy_magnet_link')}>
                <button type="button" className="cursor-pointer" onClick={() => copyMagnet(item.torrent.magnetUri)}>
                  {magnetCopied ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Magnet className="size-4 text-primary" />
                  )}
                </button>
              </SimpleTooltip>
              <SimpleTooltip label={t('torrents.download_torrent_file')}>
                <a href={resolveTorrentDownloadUrl(item.infoHash)} className="cursor-pointer">
                  <Download className="size-4 text-primary" />
                </a>
              </SimpleTooltip>
              <SimpleTooltip label={t('torrents.copy_info_hash')}>
                <button type="button" className="cursor-pointer" onClick={() => copyInfoHash(item.infoHash)}>
                  {infoHashCopied ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <Fingerprint className="size-4 text-primary" />
                  )}
                </button>
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
      {expandedDuplicates && <TorrentDuplicatesRow infoHash={item.infoHash} colSpan={displayedColumns.length} />}
    </Fragment>
  )
}

export function TorrentsTable({
  items,
  controls,
  displayedColumns,
  selected,
  onToggleSelected,
  onToggleAll,
  onSelectControls,
  favoritesListId,
  onAssignFavorite,
  onRemoveFavorite,
}: {
  items: TorrentContentFragment[]
  controls: TorrentSearchControls
  displayedColumns: readonly Column[]
  selected: Set<string>
  onToggleSelected: (infoHash: string) => void
  onToggleAll: () => void
  onSelectControls: (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void
  favoritesListId: (item: TorrentContentFragment) => string | null
  onAssignFavorite: (item: TorrentContentFragment, listId: string) => void
  onRemoveFavorite: (item: TorrentContentFragment) => void
}) {
  const { t } = useTranslation()
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
              <th className="py-2 text-center font-medium">{t('torrents.actions')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <TorrentRow
              key={item.infoHash}
              item={item}
              displayedColumns={displayedColumns}
              expanded={controls.selectedTorrent?.infoHash === item.infoHash}
              expandedDuplicates={expandedDuplicatesOf === item.infoHash}
              isSelected={selected.has(item.infoHash)}
              onToggleSelected={() => onToggleSelected(item.infoHash)}
              onRowClick={() => toggleSelectedTorrent(item.infoHash)}
              onToggleDuplicates={() =>
                setExpandedDuplicatesOf((prev) => (prev === item.infoHash ? null : item.infoHash))
              }
              favoritesListId={favoritesListId(item)}
              onAssignFavorite={(listId) => onAssignFavorite(item, listId)}
              onRemoveFavorite={() => onRemoveFavorite(item)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
