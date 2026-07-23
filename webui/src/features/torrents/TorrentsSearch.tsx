import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, X, ArrowDown, ArrowUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { Paginator } from '@/components/ui/paginator'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { FacetsSidebar } from './FacetsSidebar'
import { TorrentsTable, allColumns, compactColumns } from './TorrentsTable'
import { TorrentsBulkActions } from './TorrentsBulkActions'
import { useTorrentSearchControls } from './useTorrentSearchControls'
import { useTorrentSearch } from './useTorrentSearch'
import { orderByOptions } from './searchControls'

export function TorrentsSearch() {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()
  const [controls, updateControls] = useTorrentSearchControls()
  const { result, loading, refresh } = useTorrentSearch(controls)
  const [queryInput, setQueryInput] = useState(controls.queryString ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(true)

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

  const filteredItems = useMemo(() => {
    const sizeMin = controls.sizeMin
    const sizeMax = controls.sizeMax
    if (!sizeMin && !sizeMax) return result.items
    return result.items.filter((item) => {
      const size = item.torrent.size
      if (sizeMin != null && size < sizeMin) return false
      if (sizeMax != null && size > sizeMax) return false
      return true
    })
  }, [result.items, controls.sizeMin, controls.sizeMax])

  const selectedItems = useMemo(() => filteredItems.filter((i) => selected.has(i.infoHash)), [filteredItems, selected])

  const commitQuery = (value: string) =>
    updateControls((c) => ({ ...c, queryString: value || undefined, page: value === c.queryString ? c.page : 1 }))

  // Auto-search shortly after the user stops typing; Enter (below) still commits immediately.
  useEffect(() => {
    const handle = setTimeout(() => {
      updateControls((c) => ({
        ...c,
        queryString: queryInput || undefined,
        page: queryInput === (c.queryString ?? '') ? c.page : 1,
      }))
    }, 300)
    return () => clearTimeout(handle)
  }, [queryInput, updateControls])

  return (
    <div className="flex">
      {drawerOpen && <FacetsSidebar controls={controls} result={result} onUpdate={updateControls} />}
      <div className="min-w-0 flex-1 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SimpleTooltip label={t('torrents.toggle_drawer')}>
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
            </Button>
          </SimpleTooltip>
          <div className="relative min-w-48 flex-1">
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
            <SelectTrigger className="w-44">
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
              <RefreshCw className="size-4" />
            </Button>
          </SimpleTooltip>
        </div>

        <div className="mb-3 rounded-lg border border-border bg-bg p-2">
          <TorrentsBulkActions selectedItems={selectedItems} />
        </div>

        <div className="rounded-lg border border-border bg-bg">
          <TorrentsTable
            items={filteredItems}
            loading={loading}
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
                const allSelected = filteredItems.every((i) => prev.has(i.infoHash))
                return allSelected ? new Set() : new Set(filteredItems.map((i) => i.infoHash))
              })
            }
            onSelectControls={updateControls}
          />
        </div>

        <Paginator
          page={controls.page}
          pageSize={controls.limit}
          pageLength={filteredItems.length}
          totalLength={result.totalCount}
          totalIsEstimate={result.totalCountIsEstimate}
          hasNextPage={result.hasNextPage}
          onPaging={(e) => updateControls((c) => ({ ...c, page: e.page, limit: e.pageSize }))}
        />
      </div>
    </div>
  )
}
