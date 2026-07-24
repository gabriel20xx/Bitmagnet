import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, ArrowDown, ArrowUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { Paginator } from '@/components/ui/paginator'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { activateFilter, deactivateFilter, facets, orderByOptions } from './queueJobsControls'
import { useQueueJobs, useQueueJobsControls } from './useQueueJobs'
import { QueueJobsTable } from './QueueJobsTable'
import { jobsTableColumns } from './queueConstants'

// Port of webui/src/app/dashboard/queue/queue-jobs.component.ts/.html

export function QueueJobs() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('routes.jobs'), t('routes.dashboard'))

  const [controls, updateControls] = useQueueJobsControls()
  const { result, refresh } = useQueueJobs(controls)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // Derived rather than reset via an effect: once the current page's items no longer contain the
  // expanded id (e.g. after a refresh or re-page), the detail row simply stops rendering expanded.
  const visibleExpandedId = expandedId && result.items.some((i) => i.id === expandedId) ? expandedId : null

  const facetInfos = facets.map((f) => {
    const input = f.extractInput(controls.facets)
    return {
      def: f,
      filter: input.filter,
      aggregations: f
        .extractAggregations(result.aggregations)
        .map((agg) => ({ ...agg, label: f.resolveLabel(agg, t) })),
    }
  })

  return (
    <div className="flex">
      {drawerOpen && (
        <div className="w-64 shrink-0 space-y-1 border-r border-border p-3">
          {facetInfos.map((facet) => (
            <div key={facet.def.key} className="border-b border-border">
              <div className="flex items-center gap-2 py-3 text-sm font-medium">
                <facet.def.icon className="size-4" />
                {t(`facets.${facet.def.key}`)}
              </div>
              <div className="pb-3">
                {facet.aggregations.length === 0 ? (
                  <p className="px-2 text-sm text-muted-fg">{t('general.none')}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {facet.aggregations.map((agg) => {
                      const checked = facet.filter?.length ? (facet.filter as unknown[]).includes(agg.value) : true
                      return (
                        <li key={String(agg.value)} className="flex items-center gap-2 px-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(isChecked) =>
                              updateControls((c) =>
                                isChecked
                                  ? activateFilter(c, facet.def, agg.value)
                                  : deactivateFilter(c, facet.def, agg.value),
                              )
                            }
                          />
                          <span className="flex-1 truncate">{agg.label}</span>
                          <small className="text-muted-fg">{agg.count.toLocaleString(i18n.language)}</small>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SimpleTooltip label={t('torrents.toggle_drawer')}>
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
            </Button>
          </SimpleTooltip>
          <Select
            value={controls.orderBy.field}
            onValueChange={(field) =>
              updateControls((c) => {
                const opt = orderByOptions.find((o) => o.field === field)
                return {
                  ...c,
                  orderBy: { field: field as typeof c.orderBy.field, descending: opt?.descending ?? false },
                  page: 1,
                }
              })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderByOptions.map((o) => (
                <SelectItem key={o.field} value={o.field}>
                  {t(`dashboard.queues.${o.field}`)}
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

        <div className="rounded-lg border border-border bg-bg">
          <QueueJobsTable
            items={result.items}
            displayedColumns={jobsTableColumns}
            expandedId={visibleExpandedId}
            onToggleExpanded={(id) => setExpandedId((cur) => (cur === id ? null : id))}
          />
        </div>

        <Paginator
          page={controls.page}
          pageSize={controls.limit}
          pageLength={result.items.length}
          totalLength={result.totalCount}
          totalIsEstimate={false}
          showLastPage
          onPaging={(e) => updateControls((c) => ({ ...c, page: e.page, limit: e.pageSize }))}
        />
      </div>
    </div>
  )
}
