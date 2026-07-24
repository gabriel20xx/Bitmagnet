import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleSlash, HardDrive, Shapes } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { formatIntEstimate } from '@/lib/utils/intEstimate'
import type { TorrentContentSearchResultFragment } from '@/lib/graphql/generated'
import { contentTypeList } from './contentTypes'
import { SizeFilter } from './SizeFilter'
import {
  activateFacet,
  activateFilter,
  clearSizeFilter,
  deactivateFacet,
  deactivateFilter,
  facets,
  hasSizeFilter,
  selectContentType,
  type TorrentSearchControls,
} from './searchControls'

export function FacetsSidebar({
  controls,
  result,
  onUpdate,
}: {
  controls: TorrentSearchControls
  result: TorrentContentSearchResultFragment
  onUpdate: (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void
}) {
  const { t, i18n } = useTranslation()

  const overallTotalCount = useMemo(() => {
    let count = 0
    let isEstimate = false
    for (const ct of result.aggregations.contentType ?? []) {
      count += ct.count
      isEstimate = isEstimate || ct.isEstimate
    }
    return { count, isEstimate }
  }, [result])

  const contentTypeCounts = useMemo(() => {
    const map: Record<string, { count: number; isEstimate: boolean }> = {}
    for (const ct of result.aggregations.contentType ?? []) {
      const key = ct.value ?? 'null'
      map[key] = { count: ct.count, isEstimate: ct.isEstimate }
    }
    return map
  }, [result])

  const availableContentTypes = useMemo(
    () => new Set((result.aggregations.contentType ?? []).flatMap((agg) => (agg.value ? [agg.value] : []))),
    [result],
  )

  const facetInfos = useMemo(
    () =>
      facets.map((f) => {
        const input = f.extractInput(controls.facets)
        return {
          def: f,
          active: input.active,
          filter: input.filter,
          relevant:
            !f.contentTypes ||
            !!(
              controls.contentType &&
              controls.contentType !== 'null' &&
              f.contentTypes.includes(controls.contentType)
            ),
          aggregations: f.extractAggregations(result.aggregations).map((agg) => ({
            ...agg,
            label: f.resolveLabel(agg, t),
          })),
        }
      }),
    [controls, result, t],
  )

  const openAccordionValues = facetInfos.filter((f) => f.active).map((f) => f.def.key)

  return (
    <div className="w-64 shrink-0 space-y-1 border-r border-border p-3">
      <div className="border-b border-border">
        <div className="flex items-center justify-between gap-2 py-3 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Shapes className="size-4" />
            {t('facets.content_type')}
          </span>
        </div>
        <div className="pb-3">
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => onUpdate((c) => selectContentType(c, null))}
                className={
                  'flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-surface-hover ' +
                  (controls.contentType === null ? 'bg-surface-hover font-medium text-primary' : '')
                }
              >
                <span className="flex items-center gap-2">
                  <CircleSlash className="size-4" />
                  {t('content_types.plural.all')}
                </span>
                <small className="text-muted-fg">
                  {formatIntEstimate(overallTotalCount.count, i18n.language, overallTotalCount.isEstimate)}
                </small>
              </button>
            </li>
            {contentTypeList.map(
              (ct) =>
                (ct.key === 'null' || availableContentTypes.has(ct.key)) && (
                  <li key={ct.key}>
                    <button
                      onClick={() => onUpdate((c) => selectContentType(c, ct.key))}
                      className={
                        'flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-surface-hover ' +
                        (controls.contentType === ct.key ? 'bg-surface-hover font-medium text-primary' : '')
                      }
                    >
                      <span className="flex items-center gap-2">
                        <ct.icon className="size-4" />
                        {t(`content_types.plural.${ct.key}`)}
                      </span>
                      <small className="text-muted-fg">
                        {contentTypeCounts[ct.key]
                          ? formatIntEstimate(
                              contentTypeCounts[ct.key].count,
                              i18n.language,
                              contentTypeCounts[ct.key].isEstimate,
                            )
                          : '0'}
                      </small>
                    </button>
                  </li>
                ),
            )}
          </ul>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex items-center justify-between gap-2 py-3 text-sm font-medium">
          <span className="flex items-center gap-2">
            <HardDrive className="size-4" />
            {t('torrents.size')}
          </span>
          {hasSizeFilter(controls) && (
            <button
              onClick={() => onUpdate(clearSizeFilter)}
              className="text-xs font-normal text-muted-fg hover:text-fg"
            >
              {t('general.clear')}
            </button>
          )}
        </div>
        <div className="pb-3">
          <SizeFilter controls={controls} onUpdate={onUpdate} />
        </div>
      </div>

      <Accordion
        type="multiple"
        value={openAccordionValues}
        onValueChange={(values) => {
          const opened = values.filter((v) => !openAccordionValues.includes(v))
          const closed = openAccordionValues.filter((v) => !values.includes(v))
          for (const key of opened) {
            const f = facets.find((f) => f.key === key)
            if (f) onUpdate((c) => activateFacet(c, f))
          }
          for (const key of closed) {
            const f = facets.find((f) => f.key === key)
            if (f) onUpdate((c) => deactivateFacet(c, f))
          }
        }}
      >
        {facetInfos
          .filter((f) => f.relevant)
          .map((facet) => (
            <AccordionItem key={facet.def.key} value={facet.def.key}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <facet.def.icon className="size-4" />
                  {t(`facets.${facet.def.key}`)}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {facet.aggregations.length === 0 && !facet.filter?.length ? (
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
                              onUpdate((c) =>
                                isChecked
                                  ? activateFilter(c, facet.def, agg.value)
                                  : deactivateFilter(
                                      c,
                                      facet.def,
                                      agg.value,
                                      facet.aggregations.map((a) => a.value),
                                    ),
                              )
                            }
                          />
                          <span className="flex-1 truncate">{agg.label}</span>
                          <small className="text-muted-fg">
                            {formatIntEstimate(agg.count, i18n.language, agg.isEstimate)}
                          </small>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    </div>
  )
}
