import type { ChartData, ChartOptions } from 'chart.js'
import { format as formatDate } from 'date-fns'
import { resolveDateLocale } from '@/lib/dates/locales'
import { getChartColor, seriesColors, type ChartBaseColor } from '@/lib/charting/chartTheme'
import {
  durationSeconds,
  eventNames,
  timeframeLengths,
  type BucketParams,
  type EventName,
  type Result,
} from './torrentMetricsConstants'
import { normalizeBucket } from './useTorrentMetrics'

// Port of webui/src/app/dashboard/torrents/torrent-chart-adapter.timeline.ts

const eventColors: Record<EventName, ChartBaseColor> = {
  created: 'primary',
  updated: 'secondary',
}

function formatBucketKey(params: BucketParams<false>, key: number, locale: string): string {
  const formatStr = params.duration === 'day' ? 'd LLL' : params.duration === 'hour' ? 'd LLL H:00' : 'H:mm'
  return formatDate(1000 * durationSeconds[params.duration] * params.multiplier * key, formatStr, {
    locale: resolveDateLocale(locale),
  })
}

export function buildTorrentTimelineChart(
  result: Result,
  locale: string,
  legend: boolean,
): { data: ChartData<'line'>; options: ChartOptions<'line'> } {
  const labels: string[] = []
  const datasets: ChartData<'line'>['datasets'] = []
  const nonEmptySources = result.sourceSummaries.filter((q) => !q.isEmpty)
  const nonEmptyBuckets = Array.from(
    new Set(nonEmptySources.flatMap((q) => (q.events ? [q.events.earliestBucket, q.events.latestBucket] : []))),
  ).sort((a, b) => a - b)

  if (nonEmptyBuckets.length) {
    const now = new Date()
    const minBucket = Math.min(
      nonEmptyBuckets[0],
      normalizeBucket(now.getTime() - 1000 * timeframeLengths[result.params.buckets.timeframe], result.params.buckets)
        .index,
    )
    const maxBucket = Math.max(
      nonEmptyBuckets[nonEmptyBuckets.length - 1],
      normalizeBucket(now, result.params.buckets).index,
    )
    for (let i = minBucket; i <= maxBucket; i++) {
      labels.push(formatBucketKey(result.params.buckets, i, locale))
    }
    const relevantEvents = eventNames.filter((n) => (result.params.event ?? n) === n)
    for (const source of nonEmptySources) {
      for (const event of relevantEvents) {
        const series: number[] = []
        for (let i = minBucket; i <= maxBucket; i++) {
          series.push(source.events?.eventBuckets?.[event]?.entries?.[`${i}`]?.count ?? 0)
        }
        const colors = seriesColors(eventColors[event])
        datasets.push({
          yAxisID: 'yCount',
          label: [source.source, event].join('/'),
          data: series,
          borderColor: colors.border,
          pointBackgroundColor: colors.pointBackground,
          pointBorderColor: colors.pointBorder,
          pointHoverBackgroundColor: colors.pointHoverBackground,
          pointHoverBorderColor: colors.pointHoverBorder,
        })
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
      x: { grid: { color: getChartColor('muted-fg') + '33' } },
    },
    plugins: {
      legend: { display: legend },
      decimation: { enabled: true },
    },
  }

  return { data: { labels, datasets }, options }
}
