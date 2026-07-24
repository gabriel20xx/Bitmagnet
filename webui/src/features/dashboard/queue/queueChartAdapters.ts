import type { ChartData, ChartOptions } from 'chart.js'
import { format as formatDate, formatDuration as formatDurationFns } from 'date-fns'
import type { TFunction } from 'i18next'
import { resolveDateLocale } from '@/lib/dates/locales'
import { getChartColor, seriesColors, type ChartBaseColor } from '@/lib/charting/chartTheme'
import {
  durationSeconds,
  eventNames,
  statusNames,
  timeframeLengths,
  type BucketParams,
  type EventName,
  type Result,
} from './queueConstants'
import { normalizeBucket } from './queueMetricsUtils'
import type { QueueJobStatus } from '@/lib/graphql/generated'

// Port of webui/src/app/dashboard/queue/queue-chart-adapter.timeline.ts and .totals.ts

const eventColors: Record<EventName, ChartBaseColor> = {
  created: 'primary',
  processed: 'success',
  failed: 'danger',
}

const statusColors: Record<QueueJobStatus, ChartBaseColor> = {
  pending: 'primary',
  processed: 'success',
  failed: 'danger',
  retry: 'warning',
}

function formatBucketKey(params: BucketParams<false>, key: number, locale: string): string {
  const formatStr = params.duration === 'day' ? 'd LLL' : params.duration === 'hour' ? 'd LLL H:00' : 'H:mm'
  return formatDate(1000 * durationSeconds[params.duration] * params.multiplier * key, formatStr, {
    locale: resolveDateLocale(locale),
  })
}

/** Mirrors the Angular adapter's bespoke duration formatter: collapses to the two most significant units. */
export function formatQueueLatency(d: number, locale: string): string {
  if (d === 0) return '0'
  let seconds = d
  let minutes = 0
  let hours = 0
  let days = 0
  if (seconds >= 60) {
    minutes = Math.floor(seconds / 60)
    seconds = seconds % 60
    if (minutes >= 5) {
      seconds = 0
      if (minutes >= 60) {
        hours = Math.floor(minutes / 60)
        minutes = minutes % 60
        if (hours >= 5) {
          minutes = 0
          if (hours >= 24) {
            days = Math.floor(hours / 24)
            hours = hours % 24
          }
        }
      }
    }
  }
  return formatDurationFns({ days, hours, minutes, seconds }, { locale: resolveDateLocale(locale) })
}

export function buildQueueTimelineChart(
  result: Result,
  t: TFunction,
  locale: string,
  legend: boolean,
): { data: ChartData<'line'>; options: ChartOptions<'line'> } {
  const labels: string[] = []
  const datasets: ChartData<'line'>['datasets'] = []
  const nonEmptyQueues = result.queues.filter((q) => !q.isEmpty)
  const nonEmptyBuckets = Array.from(
    new Set(nonEmptyQueues.flatMap((q) => (q.events ? [q.events.earliestBucket, q.events.latestBucket] : []))),
  ).sort((a, b) => a - b)
  const now = new Date()
  const minBucket =
    result.params.buckets.timeframe === 'all'
      ? nonEmptyBuckets[0]
      : Math.min(
          nonEmptyBuckets[0],
          normalizeBucket(
            now.getTime() - 1000 * timeframeLengths[result.params.buckets.timeframe],
            result.params.buckets,
          ).index,
        )
  const maxBucket = Math.max(
    nonEmptyBuckets[nonEmptyBuckets.length - 1],
    normalizeBucket(now, result.params.buckets).index,
  )

  if (nonEmptyBuckets.length) {
    for (let i = minBucket; i <= maxBucket; i++) {
      labels.push(formatBucketKey(result.params.buckets, i, locale))
    }
    const relevantEvents = eventNames.filter((n) => (result.params.event ?? n) === n)
    for (const queue of nonEmptyQueues) {
      const pushEventDataset = (event: EventName): void => {
        const series: number[] = []
        for (let i = minBucket; i <= maxBucket; i++) {
          series.push(queue.events?.eventBuckets?.[event]?.entries?.[`${i}`]?.count ?? 0)
        }
        const colors = seriesColors(eventColors[event])
        datasets.push({
          yAxisID: 'yCount',
          label: queue.queue + ': ' + t(`dashboard.queues.${event}`),
          data: series,
          borderColor: colors.border,
          pointBackgroundColor: colors.pointBackground,
          pointBorderColor: colors.pointBorder,
          pointHoverBackgroundColor: colors.pointHoverBackground,
          pointHoverBorderColor: colors.pointHoverBorder,
        })
      }

      // "failed" is pushed after latency (rather than inline with the other events) so it
      // renders after it in the legend/draw order.
      for (const event of relevantEvents.filter((e) => e !== 'failed')) {
        pushEventDataset(event)
      }

      const latencyEvents = (['processed', 'failed'] as const).filter((e) => relevantEvents.includes(e))
      if (latencyEvents.length) {
        const latencySeries: Array<number | null> = []
        for (let i = minBucket; i <= maxBucket; i++) {
          const acc = (['processed', 'failed'] as const)
            .filter((e) => relevantEvents.includes(e))
            .reduce<[number, number] | null>((accum, next) => {
              const entry = queue.events?.eventBuckets?.[next]?.entries?.[`${i}`]
              if (!entry?.count) return accum
              return [(accum?.[0] ?? 0) + entry.latency, (accum?.[1] ?? 0) + entry.count]
            }, null)
          latencySeries.push(acc ? acc[0] / acc[1] : null)
        }
        const secondaryColor = getChartColor('secondary')
        datasets.push({
          yAxisID: 'yLatency',
          label: queue.queue + ': ' + t('dashboard.queues.latency'),
          data: latencySeries,
          borderColor: secondaryColor,
          pointHoverBackgroundColor: secondaryColor,
          pointHoverBorderColor: secondaryColor,
        })
      }

      if (relevantEvents.includes('failed')) {
        pushEventDataset('failed')
      }
    }
  }

  const options: ChartOptions<'line'> = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.5 } },
    scales: {
      yCount: {
        position: 'left',
        ticks: { callback: (v) => parseInt(String(v)).toLocaleString(locale) },
        grid: { color: getChartColor('muted-fg') + '33' },
      },
      yLatency: {
        position: 'right',
        ticks: { callback: (v) => formatQueueLatency(parseInt(String(v)), locale) },
        grid: { display: false },
      },
      x: { grid: { color: getChartColor('muted-fg') + '33' } },
    },
    plugins: {
      legend: { display: legend },
      decimation: { enabled: true },
      tooltip: {
        callbacks: {
          label: (context) =>
            context.dataset.yAxisID === 'yCount'
              ? (context.formattedValue as string)
              : formatQueueLatency(context.parsed.y ?? 0, locale),
        },
      },
    },
  }

  return { data: { labels, datasets }, options }
}

export function buildQueueTotalsChart(
  result: Result,
  t: TFunction,
  legend: boolean,
): { data: ChartData<'bar'>; options: ChartOptions<'bar'> } {
  const labels: string[] = []
  const datasets: ChartData<'bar'>['datasets'] = []
  const bucketKeys = Array.from(
    new Set(result.queues.flatMap((q) => (q.events ? [q.events.earliestBucket, q.events.latestBucket] : []))),
  )
  if (bucketKeys.length) {
    const nonEmptyQueues = result.queues.filter((q) => !q.isEmpty)
    labels.push(...nonEmptyQueues.map((q) => q.queue))
    const statuses: QueueJobStatus[] = []
    switch (result.params.event) {
      case 'created':
        statuses.push('pending')
        break
      case 'processed':
        statuses.push('processed')
        break
      case 'failed':
        statuses.push('retry', 'failed')
        break
      default:
        statuses.push(...statusNames)
        break
    }
    datasets.push(
      ...statuses.map((status) => ({
        label: t(`dashboard.queues.${status}`),
        data: nonEmptyQueues.map((q) => q.statusCounts[status]),
        backgroundColor: getChartColor(statusColors[status]),
      })),
    )
  }

  const options: ChartOptions<'bar'> = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        ticks: { callback: (v) => parseInt(String(v)).toLocaleString() },
        grid: { color: getChartColor('muted-fg') + '33' },
      },
      y: { grid: { display: false } },
    },
    plugins: { legend: { display: legend } },
  }

  return { data: { labels, datasets }, options }
}
