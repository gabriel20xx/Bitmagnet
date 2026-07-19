import type { QueueMetricsQuery } from '@/lib/graphql/generated'
import {
  durationSeconds,
  emptyStatusCounts,
  timeframeLengths,
  type BucketParams,
  type BucketSpan,
  type EventBucket,
  type EventBucketEntries,
  type EventBuckets,
  type EventName,
  type Params,
  type QueueEvents,
  type Result,
  type StatusCounts,
} from './queueConstants'

// Port of webui/src/app/dashboard/queue/queue-metrics.controller.ts (pure data-transformation half;
// the Apollo/rxjs plumbing lives in useQueueMetrics.ts instead).

export type NormalizedBucket = {
  key: string
  index: number
  start: Date
}

export const normalizeBucket = (
  rawDate: string | number | Date,
  params: Pick<BucketParams<false>, 'duration' | 'multiplier'>,
): NormalizedBucket => {
  const date = new Date(rawDate)
  const msMultiplier = 1000 * durationSeconds[params.duration] * params.multiplier
  const baseNumber = Math.floor(date.getTime() / msMultiplier)
  return {
    key: `${baseNumber}`,
    index: baseNumber,
    start: new Date(baseNumber * msMultiplier),
  }
}

/**
 * Minimal ISO8601 duration ("PT1H2M3.5S") -> seconds parser. The GraphQL `latency` field is only
 * ever a job-processing latency (seconds to hours), so unlike the Angular original (which used the
 * full `ISO8601-duration` package with calendar-accurate month/year handling) this uses fixed
 * 365-day years / 30-day months, which is never exercised in practice for this field.
 */
export const parseIso8601DurationSeconds = (value: string): number => {
  const match =
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)S)?)?$/.exec(
      value.replace(/,/g, '.'),
    )
  if (!match) return 0
  const [, years, months, weeks, days, hours, minutes, seconds] = match
  const num = (s: string | undefined) => (s ? parseFloat(s) : 0)
  return (
    num(years) * 365 * 24 * 3600 +
    num(months) * 30 * 24 * 3600 +
    num(weeks) * 7 * 24 * 3600 +
    num(days) * 24 * 3600 +
    num(hours) * 3600 +
    num(minutes) * 60 +
    num(seconds)
  )
}

const emptyRawResult: QueueMetricsQuery = { queue: { metrics: { buckets: [] } } }

const fromEntries = <K extends string, V>(entries: Array<[K, V]>): Partial<Record<K, V>> =>
  Object.fromEntries(entries) as Partial<Record<K, V>>

export const createBucketParams = (
  params: Params,
  rawResult: QueueMetricsQuery,
): {
  bucketParams: BucketParams<false>
  earliestBucket: NormalizedBucket | undefined
  latestBucket: NormalizedBucket
} => {
  const duration = params.buckets.duration === 'AUTO' ? 'hour' : params.buckets.duration
  let multiplier = params.buckets.multiplier === 'AUTO' ? 1 : params.buckets.multiplier
  const timeframe = params.buckets.timeframe
  const now = new Date()
  const nowBucket = normalizeBucket(now, { duration, multiplier })
  const startBucket =
    timeframe === 'all'
      ? undefined
      : normalizeBucket(now.getTime() - 1000 * timeframeLengths[timeframe], { duration, multiplier })
  const allBuckets = [
    ...(startBucket ? [startBucket] : []),
    ...rawResult.queue.metrics.buckets.flatMap((b) => [
      normalizeBucket(b.createdAtBucket, { duration, multiplier }),
      ...(b.ranAtBucket ? [normalizeBucket(b.ranAtBucket, { duration, multiplier })] : []),
    ]),
    nowBucket,
  ]
    .filter((b) => !startBucket || b.index >= startBucket.index)
    .sort((a, b) => a.index - b.index)
  const minBucket = allBuckets[0]
  const maxBucket = allBuckets[allBuckets.length - 1]
  if (params.buckets.multiplier === 'AUTO') {
    const targetSpan = 20
    const span = maxBucket.index - minBucket.index
    multiplier = Math.min(60, Math.max(Math.floor(span / (targetSpan * 5)) * 5, 1))
  }
  return {
    bucketParams: { duration, multiplier, timeframe },
    earliestBucket:
      timeframe === 'all'
        ? undefined
        : normalizeBucket(now.getTime() - 1000 * timeframeLengths[timeframe], { duration, multiplier }),
    latestBucket: normalizeBucket(Math.max(now.getTime(), maxBucket.start.getTime()), { duration, multiplier }),
  }
}

export const createResult = (params: Params, rawResult: QueueMetricsQuery = emptyRawResult): Result => {
  const { bucketParams, earliestBucket, latestBucket } = createBucketParams(params, rawResult)
  const queues = Object.entries(
    rawResult.queue.metrics.buckets.reduce<
      Record<string, [StatusCounts, Partial<Record<EventName, EventBucketEntries>>]>
    >((acc, next) => {
      if (next.queue !== (params.queue ?? next.queue)) {
        return acc
      }
      let createdAt: NormalizedBucket | undefined
      let ranAt: NormalizedBucket | undefined
      if ((params.event ?? 'created') === 'created') {
        createdAt = normalizeBucket(next.createdAtBucket, bucketParams)
        if (earliestBucket && earliestBucket.index > createdAt.index) {
          createdAt = undefined
        }
      }
      if (next.ranAtBucket && params.event !== 'created') {
        ranAt = normalizeBucket(next.ranAtBucket, bucketParams)
        if (ranAt && (latestBucket.index < ranAt.index || (earliestBucket && earliestBucket.index > ranAt.index))) {
          ranAt = undefined
        }
      }
      if (next.queue !== params.queue && !createdAt && (!ranAt || next.status === 'pending')) {
        return acc
      }
      const [currentStatusCounts, currentEventBuckets] = acc[next.queue] ?? [emptyStatusCounts, {}]
      const currentLatency = next.latency ? parseIso8601DurationSeconds(next.latency) : undefined
      return {
        ...acc,
        [next.queue]: [
          (next.status === 'pending' ? createdAt : ranAt)
            ? { ...currentStatusCounts, [next.status]: next.count + currentStatusCounts[next.status] }
            : currentStatusCounts,
          {
            created: createdAt
              ? {
                  ...currentEventBuckets.created,
                  [createdAt.key]: {
                    count: next.count + (currentEventBuckets.created?.[createdAt.key]?.count ?? 0),
                    latency: 0,
                    startTime: createdAt.start,
                  },
                }
              : currentEventBuckets.created,
            processed:
              ranAt && next.status === 'processed' && (params.event ?? 'processed') === 'processed'
                ? {
                    ...currentEventBuckets.processed,
                    [ranAt.key]: {
                      count: next.count + (currentEventBuckets.processed?.[ranAt.key]?.count ?? 0),
                      latency: (currentEventBuckets.processed?.[ranAt.key]?.latency ?? 0) + (currentLatency ?? 0),
                      startTime: ranAt.start,
                    },
                  }
                : currentEventBuckets.processed,
            failed:
              ranAt && next.status === 'failed' && (params.event ?? 'failed') === 'failed'
                ? {
                    ...currentEventBuckets.failed,
                    [ranAt.key]: {
                      count: next.count + (currentEventBuckets.failed?.[ranAt.key]?.count ?? 0),
                      latency: (currentEventBuckets.failed?.[ranAt.key]?.latency ?? 0) + (currentLatency ?? 0),
                      startTime: ranAt.start,
                    },
                  }
                : currentEventBuckets.failed,
          },
        ],
      }
    }, {}),
  ).map(([queue, [statusCounts, eventBuckets]]) => {
    let events: QueueEvents | undefined
    if (Object.keys(eventBuckets).length) {
      const bucketDates = Array<number>()
      const buckets: EventBuckets = fromEntries(
        (['created', 'processed', 'failed'] as const).flatMap<[EventName, EventBucket]>((event) => {
          const entries = fromEntries(
            Object.entries(eventBuckets[event] ?? {})
              .filter(([, v]) => v?.count)
              .sort(([a], [b]) => (parseInt(a) < parseInt(b) ? 1 : -1)),
          )
          const keys = Object.keys(entries)
          if (!keys.length) {
            return []
          }
          const earliest = parseInt(keys[0])
          const latest = parseInt(keys[keys.length - 1])
          bucketDates.push(earliest, latest)
          return [[event, { earliestBucket: earliest, latestBucket: latest, entries }]]
        }),
      )
      bucketDates.sort()
      events = {
        bucketDuration: bucketParams.duration,
        earliestBucket: bucketDates[0],
        latestBucket: bucketDates[bucketDates.length - 1],
        eventBuckets: buckets,
      }
    }
    return {
      queue,
      statusCounts,
      events,
      isEmpty: !events?.eventBuckets,
    }
  })
  let bucketSpan: BucketSpan | undefined
  const earliestFoundBucket = queues.flatMap((q) => (q.events ? [q.events.earliestBucket] : [])).sort()[0]
  const latestFoundBucket = queues
    .flatMap((q) => (q.events ? [q.events.latestBucket] : []))
    .sort()
    .reverse()[0]
  if (earliestFoundBucket !== undefined && latestFoundBucket !== undefined) {
    bucketSpan = { earliestBucket: earliestFoundBucket, latestBucket: latestFoundBucket }
  }
  return {
    params: { ...params, buckets: bucketParams },
    queues,
    bucketSpan,
  }
}
