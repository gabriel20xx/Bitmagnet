import type { TFunction } from 'i18next'
import { Boxes, ListChecks, type LucideIcon } from 'lucide-react'
import type {
  QueueJobsQueryResultFragment,
  QueueJobsOrderByField,
  QueueJobsQueryVariables,
  QueueJobStatus,
} from '@/lib/graphql/generated'
import { intParam, stringListParam, stringParam } from '@/lib/utils/queryString'
import { statusNames } from './queueConstants'

// Port of webui/src/app/dashboard/queue/queue-jobs.controller.ts, adapted to this app's URL-synced
// controls convention (see src/features/torrents/searchControls.ts) rather than pure in-memory state.

export type FacetInput<TValue = unknown> = {
  filter?: TValue[]
}

export interface OrderBySelection {
  field: QueueJobsOrderByField
  descending: boolean
}

export interface QueueJobsControls {
  limit: number
  page: number
  orderBy: OrderBySelection
  facets: {
    queue: FacetInput<string>
    status: FacetInput<QueueJobStatus>
  }
}

export const defaultLimit = 20

export const orderByOptions: OrderBySelection[] = [
  { field: 'created_at', descending: true },
  { field: 'ran_at', descending: true },
  { field: 'priority', descending: false },
]

export const defaultOrderBy: OrderBySelection = { field: 'ran_at', descending: true }

export const initControls: QueueJobsControls = {
  limit: defaultLimit,
  page: 1,
  orderBy: defaultOrderBy,
  facets: {
    queue: {},
    status: {},
  },
}

export type Agg<T> = {
  value: T
  label: string
  count: number
}

export interface FacetDefinition<T> {
  key: string
  icon: LucideIcon
  extractInput: (facets: QueueJobsControls['facets']) => FacetInput<T>
  patchInput: (facets: QueueJobsControls['facets'], input: FacetInput<T>) => QueueJobsControls['facets']
  extractAggregations: (aggs: QueueJobsQueryResultFragment['aggregations']) => Array<Agg<T>>
  resolveLabel: (agg: Agg<T>, t: TFunction) => string
}

export const queueFacet: FacetDefinition<string> = {
  key: 'queue',
  icon: Boxes,
  extractInput: (f) => f.queue,
  patchInput: (f, i) => ({ ...f, queue: i }),
  extractAggregations: (aggs) => aggs.queue ?? [],
  resolveLabel: (agg) => agg.label,
}

export const statusFacet: FacetDefinition<QueueJobStatus> = {
  key: 'status',
  icon: ListChecks,
  extractInput: (f) => f.status,
  patchInput: (f, i) => ({ ...f, status: i }),
  extractAggregations: (aggs) => aggs.status ?? [],
  resolveLabel: (agg, t) => t(`dashboard.queues.${agg.label}`),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const facets: FacetDefinition<any>[] = [queueFacet, statusFacet]

export function controlsToQueryVariables(ctrl: QueueJobsControls): QueueJobsQueryVariables {
  return {
    input: {
      limit: ctrl.limit,
      page: ctrl.page,
      totalCount: true,
      orderBy: [
        ctrl.orderBy,
        ...(ctrl.orderBy.field !== 'created_at'
          ? [{ field: 'created_at' as const, descending: ctrl.orderBy.descending }]
          : []),
      ],
      facets: {
        queue: { aggregate: true, filter: ctrl.facets.queue.filter },
        status: { aggregate: true, filter: ctrl.facets.status.filter },
      },
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function activateFilter(ctrl: QueueJobsControls, def: FacetDefinition<any>, filter: unknown): QueueJobsControls {
  const input = def.extractInput(ctrl.facets)
  return {
    ...ctrl,
    page: 1,
    facets: def.patchInput(ctrl.facets, {
      ...input,
      filter: Array.from(new Set([...((input.filter as unknown[] | undefined) ?? []), filter])).sort(),
    }),
  }
}

export function deactivateFilter(
  ctrl: QueueJobsControls,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: FacetDefinition<any>,
  filter: unknown,
): QueueJobsControls {
  const input = def.extractInput(ctrl.facets)
  const nextFilter = (input.filter as unknown[] | undefined)?.filter((value) => value !== filter)
  return {
    ...ctrl,
    page: 1,
    facets: def.patchInput(ctrl.facets, { ...input, filter: nextFilter?.length ? nextFilter : undefined }),
  }
}

export function selectOrderBy(ctrl: QueueJobsControls, field: QueueJobsOrderByField): QueueJobsControls {
  const orderBy: OrderBySelection = {
    field,
    descending: orderByOptions.find((o) => o.field === field)?.descending ?? false,
  }
  return { ...ctrl, orderBy, page: 1 }
}

export function toggleOrderByDirection(ctrl: QueueJobsControls): QueueJobsControls {
  return { ...ctrl, orderBy: { ...ctrl.orderBy, descending: !ctrl.orderBy.descending }, page: 1 }
}

function orderByParam(params: URLSearchParams): OrderBySelection {
  const field = stringParam(params, 'order')
  const opt = orderByOptions.find((o) => o.field === field)
  const strDesc = stringParam(params, 'desc')
  const desc = strDesc === '1' ? true : strDesc === '0' ? false : undefined
  if (opt) return { field: opt.field, descending: desc ?? opt.descending }
  return defaultOrderBy
}

export function paramsToControls(params: URLSearchParams): QueueJobsControls {
  const status = stringListParam(params, 'status')
  return {
    limit: intParam(params, 'limit') ?? defaultLimit,
    page: intParam(params, 'page') ?? 1,
    orderBy: orderByParam(params),
    facets: {
      queue: { filter: stringListParam(params, 'queue') },
      status: { filter: status?.filter((s): s is QueueJobStatus => (statusNames as readonly string[]).includes(s)) },
    },
  }
}

export function controlsToParams(ctrl: QueueJobsControls): URLSearchParams {
  const params = new URLSearchParams()
  const set = (key: string, value: string | undefined) => {
    if (value !== undefined && value !== '') params.set(key, value)
  }
  set('page', ctrl.page === 1 ? undefined : String(ctrl.page))
  set('limit', ctrl.limit === defaultLimit ? undefined : String(ctrl.limit))
  const isDefaultOrder =
    ctrl.orderBy.field === defaultOrderBy.field && ctrl.orderBy.descending === defaultOrderBy.descending
  set('order', isDefaultOrder ? undefined : ctrl.orderBy.field)
  set('desc', isDefaultOrder ? undefined : ctrl.orderBy.descending ? '1' : '0')
  if (ctrl.facets.queue.filter?.length) set('queue', ctrl.facets.queue.filter.join(','))
  if (ctrl.facets.status.filter?.length) set('status', ctrl.facets.status.filter.join(','))
  return params
}
