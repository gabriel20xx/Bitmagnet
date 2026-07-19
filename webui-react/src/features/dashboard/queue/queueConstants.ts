import type { MetricsBucketDuration, QueueJobStatus } from '@/lib/graphql/generated'

// Port of webui/src/app/dashboard/queue/queue.constants.ts + queue-metrics.types.ts

// Table columns for QueueJobsTable (queue-jobs-table.component.ts's `allColumns`); kept out of the
// table component file so it stays a component-only export (react-refresh/only-export-components).
export const jobsTableColumns = ['id', 'queue', 'priority', 'status', 'error', 'createdAt', 'ranAt'] as const
export type JobsTableColumn = (typeof jobsTableColumns)[number]

export const resolutionNames = ['day', 'hour', 'minute'] as const

export const durationSeconds: Record<MetricsBucketDuration, number> = {
  minute: 60,
  hour: 60 * 60,
  day: 60 * 60 * 24,
}

export const eventNames = ['created', 'processed', 'failed'] as const
export type EventName = (typeof eventNames)[number]

export const statusNames = ['pending', 'processed', 'retry', 'failed'] as const satisfies readonly QueueJobStatus[]

export const timeframeNames = [
  'minutes_15',
  'minutes_30',
  'hours_1',
  'hours_6',
  'hours_12',
  'days_1',
  'weeks_1',
  'all',
] as const
export type TimeframeName = (typeof timeframeNames)[number]

export const timeframeLengths: Record<TimeframeName, number> = {
  minutes_15: 60 * 15,
  minutes_30: 60 * 30,
  hours_1: 60 * 60,
  hours_6: 60 * 60 * 6,
  hours_12: 60 * 60 * 12,
  days_1: 60 * 60 * 24,
  weeks_1: 60 * 60 * 24 * 7,
  all: Infinity,
}

export const availableQueueNames = ['process_torrent', 'process_torrent_batch']

export const autoRefreshIntervalNames = ['off', 'seconds_10', 'seconds_30', 'minutes_1', 'minutes_5'] as const
export type AutoRefreshInterval = (typeof autoRefreshIntervalNames)[number]

export const autoRefreshIntervals: Record<AutoRefreshInterval, number | null> = {
  off: null,
  seconds_10: 10,
  seconds_30: 30,
  minutes_1: 60,
  minutes_5: 60 * 5,
}

export const emptyStatusCounts: StatusCounts = {
  pending: 0,
  failed: 0,
  retry: 0,
  processed: 0,
}

export type BucketParams<WithAuto extends boolean = boolean> = {
  duration: WithAuto extends true ? 'AUTO' | MetricsBucketDuration : MetricsBucketDuration
  multiplier: WithAuto extends true ? 'AUTO' | number : number
  timeframe: TimeframeName
}

export const defaultBucketParams: BucketParams = {
  duration: 'hour',
  multiplier: 1,
  timeframe: 'all',
}

export type StatusCounts = Record<QueueJobStatus, number>

export type Params<WithAuto extends boolean = boolean> = {
  buckets: BucketParams<WithAuto>
  queue?: string
  event?: EventName
  autoRefresh: AutoRefreshInterval
}

export const emptyParams: Params = {
  buckets: defaultBucketParams,
  autoRefresh: 'off',
}

export type EventBucketEntry = {
  startTime: Date
  count: number
  latency: number
}

export type EventBucketEntries = Partial<Record<string, EventBucketEntry>>

export type BucketSpan = {
  earliestBucket: number
  latestBucket: number
}

export type EventBucket = BucketSpan & {
  entries: EventBucketEntries
}

export type EventBuckets = Partial<Record<EventName, EventBucket>>

export type QueueEvents = BucketSpan & {
  bucketDuration: MetricsBucketDuration
  eventBuckets: EventBuckets
}

export type QueueSummary<IsEmpty extends boolean = boolean> = {
  queue: string
  isEmpty: IsEmpty
  statusCounts: StatusCounts
  events: IsEmpty extends false ? QueueEvents : undefined
}

export type Result = {
  params: Params<false>
  bucketSpan?: BucketSpan
  queues: QueueSummary[]
}

export const emptyResult: Result = {
  params: emptyParams as Params<false>,
  queues: [],
}
