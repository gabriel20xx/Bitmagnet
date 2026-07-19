import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import {
  TorrentMetricsDocument,
  type MetricsBucketDuration,
  type TorrentMetricsQuery,
  type TorrentMetricsQueryVariables,
} from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import {
  autoRefreshIntervals,
  durationSeconds,
  timeframeLengths,
  type AutoRefreshInterval,
  type BucketParams,
  type EventBucket,
  type EventBuckets,
  type EventName,
  type Params,
  type Result,
  type TimeframeName,
  type TorrentEvents,
} from './torrentMetricsConstants'

// Port of webui/src/app/dashboard/torrents/torrent-metrics.controller.ts + torrent-metrics.utils.ts

export type NormalizedBucket = { key: string; index: number; start: Date }

export const normalizeBucket = (
  rawDate: string | number | Date,
  params: Pick<BucketParams<false>, 'duration' | 'multiplier'>,
): NormalizedBucket => {
  const date = new Date(rawDate)
  const msMultiplier = 1000 * durationSeconds[params.duration] * params.multiplier
  const baseNumber = Math.floor(date.getTime() / msMultiplier)
  return { key: `${baseNumber}`, index: baseNumber, start: new Date(baseNumber * msMultiplier) }
}

const fromEntries = <K extends string, V>(entries: Array<[K, V]>): Partial<Record<K, V>> =>
  Object.fromEntries(entries) as Partial<Record<K, V>>

const emptyRawResult: TorrentMetricsQuery = {
  torrent: { metrics: { buckets: [] }, listSources: { sources: [{ key: 'dht', name: 'DHT' }] } },
}

const createBucketParams = (
  params: Params,
  rawResult: TorrentMetricsQuery,
): { bucketParams: BucketParams<false>; earliestBucket: NormalizedBucket; latestBucket: NormalizedBucket } => {
  const duration = params.buckets.duration === 'AUTO' ? 'hour' : params.buckets.duration
  let multiplier = params.buckets.multiplier === 'AUTO' ? 1 : params.buckets.multiplier
  const timeframe = params.buckets.timeframe
  const now = new Date()
  const nowBucket = normalizeBucket(now, { duration, multiplier })
  const startBucket = normalizeBucket(now.getTime() - 1000 * timeframeLengths[timeframe], { duration, multiplier })
  const allBuckets = [
    startBucket,
    ...rawResult.torrent.metrics.buckets.flatMap((b) => [normalizeBucket(b.bucket, { duration, multiplier })]),
    nowBucket,
  ]
    .filter((b) => b.index >= startBucket.index)
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
    earliestBucket: normalizeBucket(now.getTime() - 1000 * timeframeLengths[timeframe], { duration, multiplier }),
    latestBucket: normalizeBucket(Math.max(now.getTime(), maxBucket.start.getTime()), { duration, multiplier }),
  }
}

export const createResult = (params: Params, rawResult: TorrentMetricsQuery = emptyRawResult): Result => {
  const { bucketParams, earliestBucket } = createBucketParams(params, rawResult)
  const sources = Object.entries(
    rawResult.torrent.metrics.buckets.reduce<
      Record<string, Partial<Record<EventName, Record<string, { startTime: Date; count: number }>>>>
    >((acc, next) => {
      if (next.source !== (params.source ?? next.source)) return acc
      let bucket: NormalizedBucket | undefined = normalizeBucket(next.bucket, bucketParams)
      if (earliestBucket && earliestBucket.index > bucket.index) bucket = undefined
      if (!bucket) return acc
      const currentEventBuckets = acc[next.source] ?? {}
      return {
        ...acc,
        [next.source]: {
          created: !next.updated
            ? {
                ...currentEventBuckets.created,
                [bucket.key]: {
                  count: next.count + (currentEventBuckets.created?.[bucket.key]?.count ?? 0),
                  startTime: bucket.start,
                },
              }
            : currentEventBuckets.created,
          updated: next.updated
            ? {
                ...currentEventBuckets.updated,
                [bucket.key]: {
                  count: next.count + (currentEventBuckets.updated?.[bucket.key]?.count ?? 0),
                  startTime: bucket.start,
                },
              }
            : currentEventBuckets.updated,
        },
      }
    }, {}),
  ).map(([source, eventBuckets]) => {
    let events: TorrentEvents | undefined
    if (Object.keys(eventBuckets).length) {
      const bucketDates = Array<number>()
      const buckets: EventBuckets = fromEntries(
        (['created', 'updated'] as const).flatMap<[EventName, EventBucket]>((event) => {
          const entries = fromEntries(
            Object.entries(eventBuckets[event] ?? {})
              .filter(([, v]) => v?.count)
              .sort(([a], [b]) => (parseInt(a) < parseInt(b) ? 1 : -1)),
          )
          const keys = Object.keys(entries)
          if (!keys.length) return []
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
    return { source, events, isEmpty: !events?.eventBuckets }
  })
  let bucketSpan: Result['bucketSpan']
  const earliestFoundBucket = sources.flatMap((q) => (q.events ? [q.events.earliestBucket] : [])).sort()[0]
  const latestFoundBucket = sources
    .flatMap((q) => (q.events ? [q.events.latestBucket] : []))
    .sort()
    .reverse()[0]
  if (earliestFoundBucket !== undefined && latestFoundBucket !== undefined) {
    bucketSpan = { earliestBucket: earliestFoundBucket, latestBucket: latestFoundBucket }
  }
  return {
    params: { ...params, buckets: bucketParams },
    sourceSummaries: sources,
    bucketSpan,
    availableSources: rawResult.torrent.listSources.sources.map((s) => ({ key: s.key, name: s.name })),
  }
}

const createVariables = (params: Params): TorrentMetricsQueryVariables => ({
  input: {
    bucketDuration: params.buckets.duration === 'AUTO' ? 'hour' : params.buckets.duration,
    sources: params.source ? [params.source] : undefined,
    startTime: new Date(new Date().getTime() - 1000 * timeframeLengths[params.buckets.timeframe]).toISOString(),
  },
})

export function useTorrentMetrics(initParams: Params) {
  const [params, setParams] = useState<Params>(initParams)
  const debouncedParams = useDebouncedValue(params, 50)
  const variables = useMemo(() => createVariables(debouncedParams), [debouncedParams])
  const pollInterval = (autoRefreshIntervals[params.autoRefresh] ?? 0) * 1000

  const { data, loading, error, refetch } = useQuery(TorrentMetricsDocument, {
    variables,
    fetchPolicy: 'no-cache',
    pollInterval,
  })

  useEffect(() => {
    if (error) addError(`Failed to load torrent metrics: ${error.message}`)
  }, [error])

  const result = useMemo(() => createResult(params, data), [params, data])

  const updateParams = useCallback((fn: (p: Params) => Params) => setParams((p) => fn(p)), [])

  const setTimeframe = useCallback(
    (timeframe: TimeframeName) => updateParams((p) => ({ ...p, buckets: { ...p.buckets, timeframe } })),
    [updateParams],
  )
  const setSource = useCallback(
    (source: string | null) => updateParams((p) => ({ ...p, source: source ?? undefined })),
    [updateParams],
  )
  const setBucketDuration = useCallback(
    (duration: MetricsBucketDuration, multiplier?: number) =>
      updateParams((p) => ({ ...p, buckets: { ...p.buckets, duration, multiplier: multiplier ?? 'AUTO' } })),
    [updateParams],
  )
  const setBucketMultiplier = useCallback(
    (multiplier: number | 'AUTO') => updateParams((p) => ({ ...p, buckets: { ...p.buckets, multiplier } })),
    [updateParams],
  )
  const setEvent = useCallback(
    (event: EventName | null) => updateParams((p) => ({ ...p, event: event ?? undefined })),
    [updateParams],
  )
  const setAutoRefreshInterval = useCallback(
    (autoRefresh: AutoRefreshInterval) => updateParams((p) => ({ ...p, autoRefresh })),
    [updateParams],
  )
  const refresh = useCallback(() => void refetch(), [refetch])

  return {
    params,
    result,
    loading,
    bucketDuration: result.params.buckets.duration,
    bucketMultiplier: result.params.buckets.multiplier,
    setTimeframe,
    setSource,
    setBucketDuration,
    setBucketMultiplier,
    setEvent,
    setAutoRefreshInterval,
    refresh,
  }
}
