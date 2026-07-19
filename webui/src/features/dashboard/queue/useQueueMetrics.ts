import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import {
  QueueMetricsDocument,
  type MetricsBucketDuration,
  type QueueMetricsQueryVariables,
} from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import {
  autoRefreshIntervals,
  timeframeLengths,
  type AutoRefreshInterval,
  type EventName,
  type Params,
  type TimeframeName,
} from './queueConstants'
import { createResult } from './queueMetricsUtils'

// Port of webui/src/app/dashboard/queue/queue-metrics.controller.ts (Apollo-facing half).

const createVariables = (params: Params): QueueMetricsQueryVariables => ({
  input: {
    bucketDuration: params.buckets.duration === 'AUTO' ? 'hour' : params.buckets.duration,
    queues: params.queue ? [params.queue] : undefined,
    startTime:
      params.buckets.timeframe === 'all'
        ? undefined
        : new Date(new Date().getTime() - 1000 * timeframeLengths[params.buckets.timeframe]).toISOString(),
  },
})

export function useQueueMetrics(initParams: Params) {
  const [params, setParams] = useState<Params>(initParams)
  const debouncedParams = useDebouncedValue(params, 50)
  const variables = useMemo(() => createVariables(debouncedParams), [debouncedParams])
  const pollInterval = (autoRefreshIntervals[params.autoRefresh] ?? 0) * 1000

  const { data, loading, error, refetch } = useQuery(QueueMetricsDocument, {
    variables,
    fetchPolicy: 'no-cache',
    pollInterval,
  })

  useEffect(() => {
    if (error) addError(`Failed to load queue metrics: ${error.message}`)
  }, [error])

  const result = useMemo(() => createResult(params, data), [params, data])

  const updateParams = useCallback((fn: (p: Params) => Params) => setParams((p) => fn(p)), [])

  const setTimeframe = useCallback(
    (timeframe: TimeframeName) => updateParams((p) => ({ ...p, buckets: { ...p.buckets, timeframe } })),
    [updateParams],
  )
  const setQueue = useCallback(
    (queue: string | null) => updateParams((p) => ({ ...p, queue: queue ?? undefined })),
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
    setQueue,
    setBucketDuration,
    setBucketMultiplier,
    setEvent,
    setAutoRefreshInterval,
    refresh,
  }
}

export type QueueMetricsHandle = ReturnType<typeof useQueueMetrics>
