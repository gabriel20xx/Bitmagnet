import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { Paginator } from '@/components/ui/paginator'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { FilterSidebar, FilterSidebarSection } from '@/features/dashboard/FilterSidebar'
import { activateFilter, deactivateFilter, facets, orderByOptions } from './queueJobsControls'
import { useQueueJobs, useQueueJobsControls } from './useQueueJobs'
import { QueueJobsTable } from './QueueJobsTable'
import { jobsTableColumns } from './queueConstants'

// Port of webui/src/app/dashboard/queue/queue-jobs.component.ts/.html

export function QueueJobs() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.jobs'), t('routes.dashboard'))
  const [controls, updateControls] = useQueueJobsControls()
  const { result, refresh } = useQueueJobs(controls)
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
    <div className="flex flex-1 flex-col min-[960px]:flex-row">
      <FilterSidebar>
        {facetInfos.map((facet) => (
          <FilterSidebarSection
            key={facet.def.key}
            icon={facet.def.icon}
            label={t(`facets.${facet.def.key}`)}
            options={facet.aggregations}
            selected={new Set(facet.filter ?? [])}
            onToggle={(value) =>
              updateControls((c) =>
                facet.filter?.includes(value)
                  ? deactivateFilter(c, facet.def, value)
                  : activateFilter(c, facet.def, value),
              )
            }
          />
        ))}
      </FilterSidebar>
      <div className="min-w-0 flex-1 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
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
            <SelectTrigger className="w-full sm:w-44">
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
