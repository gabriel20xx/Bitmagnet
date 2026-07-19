import type { MetricsBucketDuration } from '@/lib/graphql/generated'

// Port of webui/src/app/dashboard/torrents/torrent-metrics.constants.ts + torrent-metrics.types.ts

export const resolutionNames = ['day', 'hour', 'minute'] as const

export const durationSeconds: Record<MetricsBucketDuration, number> = {
  minute: 60,
  hour: 60 * 60,
  day: 60 * 60 * 24,
}

export const eventNames = ['created', 'updated'] as const
export type EventName = (typeof eventNames)[number]

export const timeframeNames = [
  'minutes_15',
  'minutes_30',
  'hours_1',
  'hours_6',
  'hours_12',
  'days_1',
  'weeks_1',
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
}

export const autoRefreshIntervalNames = ['off', 'seconds_10', 'seconds_30', 'minutes_1', 'minutes_5'] as const
export type AutoRefreshInterval = (typeof autoRefreshIntervalNames)[number]

export const autoRefreshIntervals: Record<AutoRefreshInterval, number | null> = {
  off: null,
  seconds_10: 10,
  seconds_30: 30,
  minutes_1: 60,
  minutes_5: 60 * 5,
}

export type BucketParams<WithAuto extends boolean = boolean> = {
  duration: WithAuto extends true ? 'AUTO' | MetricsBucketDuration : MetricsBucketDuration
  multiplier: WithAuto extends true ? 'AUTO' | number : number
  timeframe: TimeframeName
}

export const defaultBucketParams: BucketParams = {
  duration: 'minute',
  multiplier: 1,
  timeframe: 'hours_1',
}

export type Params<WithAuto extends boolean = boolean> = {
  buckets: BucketParams<WithAuto>
  source?: string
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

export type TorrentEvents = BucketSpan & {
  bucketDuration: MetricsBucketDuration
  eventBuckets: EventBuckets
}

export type SourceSummary<IsEmpty extends boolean = boolean> = {
  source: string
  isEmpty: IsEmpty
  events: IsEmpty extends false ? TorrentEvents : undefined
}

export type AvailableSource = { key: string; name: string }

export type Result = {
  params: Params<false>
  bucketSpan?: BucketSpan
  sourceSummaries: SourceSummary[]
  availableSources: AvailableSource[]
}
