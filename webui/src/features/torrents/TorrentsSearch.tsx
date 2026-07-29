import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, X, ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { Paginator } from '@/components/ui/paginator'
import { LoadingBar } from '@/components/ui/loading-bar'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { useLiveTorrentSearch } from '@/lib/preferences/searchPreferences'
import { cn } from '@/lib/utils/cn'
import { FilterBar } from '@/features/dashboard/FilterBar'
import { FacetsSidebar } from './FacetsSidebar'
import { TorrentsTable, allColumns, compactColumns } from './TorrentsTable'
import { TorrentsBulkActions } from './TorrentsBulkActions'
import { useTorrentSearchControls } from './useTorrentSearchControls'
import { useTorrentSearch } from './useTorrentSearch'
import { useFavorite } from './useFavorite'
import { applyFavoriteOverrides, orderByOptions } from './searchControls'

export function TorrentsSearch() {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()
  const [controls, updateControls] = useTorrentSearchControls()
  const { result, refresh, loading } = useTorrentSearch(controls)
  const { favoritesListId, overrides, assign, remove, assignMany } = useFavorite(refresh)
  const [liveSearchEnabled] = useLiveTorrentSearch()
  const [queryInput, setQueryInput] = useState(controls.queryString ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Adjust local state in response to prop/query changes during render (React's
  // recommended alternative to a synchronizing effect), rather than in a useEffect.
  const [prevQueryString, setPrevQueryString] = useState(controls.queryString)
  if (controls.queryString !== prevQueryString) {
    setPrevQueryString(controls.queryString)
    setQueryInput(controls.queryString ?? '')
  }

  const [prevItems, setPrevItems] = useState(result.items)
  if (result.items !== prevItems) {
    setPrevItems(result.items)
    const infoHashes = new Set(result.items.map((i) => i.infoHash))
    setSelected((prev) => {
      const next = new Set([...prev].filter((h) => infoHashes.has(h)))
      return next.size === prev.size ? prev : next
    })
  }

  useDocumentTitle(
    controls.queryString,
    controls.contentType && controls.contentType !== 'null' ? t(`content_types.plural.${controls.contentType}`) : null,
    controls.page > 1 ? t('paginator.page_x', { x: controls.page }) : null,
    t('routes.torrents'),
  )

  const selectedItems = useMemo(() => result.items.filter((i) => selected.has(i.infoHash)), [result.items, selected])

  // Reflects not-yet-confirmed favorite assignments/removals in the sidebar's favorites-list
  // counts immediately, rather than waiting on the refetch that `useFavorite`'s onChanged
  // callback (`refresh`, above) eventually triggers to reconcile with the server.
  const sidebarResult = useMemo(
    () => ({ ...result, aggregations: applyFavoriteOverrides(result.aggregations, result.items, overrides) }),
    [result, overrides],
  )

  const commitQuery = (value: string) =>
    updateControls((c) => ({ ...c, queryString: value || undefined, page: value === c.queryString ? c.page : 1 }))

  // Auto-search shortly after the user stops typing, only when opted into via the admin page
  // (see QueueAdmin); otherwise Enter (below) is the only way to commit a search.
  useEffect(() => {
    if (!liveSearchEnabled) return

    const handle = setTimeout(() => {
      updateControls((c) => ({
        ...c,
        queryString: queryInput || undefined,
        page: queryInput === (c.queryString ?? '') ? c.page : 1,
      }))
    }, 300)
    return () => clearTimeout(handle)
  }, [queryInput, updateControls, liveSearchEnabled])

  return (
    <div className="flex flex-1 flex-col">
      <FilterBar>
        <FacetsSidebar controls={controls} result={sidebarResult} onUpdate={updateControls} />
      </FilterBar>
      <div className="min-w-0 flex-1 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitQuery(queryInput)
              }}
              placeholder={t('torrents.search')}
              autoCapitalize="none"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {queryInput && (
              <button
                onClick={() => {
                  setQueryInput('')
                  commitQuery('')
                }}
                title={t('torrents.clear_search')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-fg hover:text-fg"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Select
            value={controls.orderBy.field}
            onValueChange={(field) =>
              updateControls((c) => {
                const opt = orderByOptions.find((o) => o.field === field)
                const orderBy = { field: field as typeof c.orderBy.field, descending: opt?.descending ?? false }
                return {
                  ...c,
                  orderBy: orderBy.field !== 'relevance' || c.queryString ? orderBy : c.orderBy,
                  page: 1,
                }
              })
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderByOptions
                .filter((o) => o.field !== 'relevance' || queryInput)
                .map((o) => (
                  <SelectItem key={o.field} value={o.field}>
                    {t(`torrents.ordering.${o.field}`)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <SimpleTooltip label={t('torrents.order_direction_toggle')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateControls((c) => ({ ...c, orderBy: { ...c.orderBy, descending: !c.orderBy.descending }, page: 1 }))
              }
            >
              {controls.orderBy.descending ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
            </Button>
          </SimpleTooltip>
          <SimpleTooltip label={t('torrents.refresh')}>
            <Button variant="default" size="icon" onClick={refresh}>
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
            </Button>
          </SimpleTooltip>
        </div>

        <div className="mb-3 rounded-lg border border-border bg-bg p-2">
          <TorrentsBulkActions selectedItems={selectedItems} onAssignFavorites={assignMany} />
        </div>

        <LoadingBar active={loading} />
        <div
          className={cn(
            'overflow-x-auto rounded-lg border border-border bg-bg transition-opacity',
            loading && 'opacity-60',
          )}
        >
          <TorrentsTable
            items={result.items}
            controls={controls}
            displayedColumns={isDesktop ? allColumns : compactColumns}
            selected={selected}
            onToggleSelected={(infoHash) =>
              setSelected((prev) => {
                const next = new Set(prev)
                if (next.has(infoHash)) next.delete(infoHash)
                else next.add(infoHash)
                return next
              })
            }
            onToggleAll={() =>
              setSelected((prev) => {
                const allSelected = result.items.every((i) => prev.has(i.infoHash))
                return allSelected ? new Set() : new Set(result.items.map((i) => i.infoHash))
              })
            }
            onSelectControls={updateControls}
            favoritesListId={favoritesListId}
            onAssignFavorite={assign}
            onRemoveFavorite={remove}
          />
        </div>

        <Paginator
          page={controls.page}
          pageSize={controls.limit}
          pageLength={result.items.length}
          totalLength={result.totalCount}
          totalIsEstimate={result.totalCountIsEstimate}
          hasNextPage={result.hasNextPage}
          onPaging={(e) => updateControls((c) => ({ ...c, page: e.page, limit: e.pageSize }))}
        />
      </div>
    </div>
  )
}
