import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Line, Bar } from 'react-chartjs-2'
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RefreshCw,
  Boxes,
  CircleDot,
  Circle,
  CirclePlus,
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  Clock,
  Ruler,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import '@/lib/charting/chartSetup'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { cn } from '@/lib/utils/cn'
import type { MetricsBucketDuration } from '@/lib/graphql/generated'
import {
  autoRefreshIntervalNames,
  availableQueueNames,
  eventNames as queueEventNames,
  resolutionNames,
  type AutoRefreshInterval,
} from '../queue/queueConstants'
import { useQueueMetrics } from '../queue/useQueueMetrics'
import { buildQueueTimelineChart, buildQueueTotalsChart } from '../queue/queueChartAdapters'
import {
  defaultBucketParams,
  eventNames as torrentEventNames,
  timeframeNames,
  type TimeframeName,
} from '../torrents/torrentMetricsConstants'
import { useTorrentMetrics } from '../torrents/useTorrentMetrics'
import { buildTorrentTimelineChart } from '../torrents/torrentChartAdapter'

// Queue metrics support an "all time" timeframe that torrent metrics don't, so the shared
// timeframe control uses torrent metrics' (narrower) options - the widest of which is weeks_1 -
// as the common default and range for both datasets.
const initialTimeframe: TimeframeName = 'weeks_1'

export function MetricsPage() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('routes.metrics'), t('routes.dashboard'))

  const m = useQueueMetrics({
    buckets: { duration: 'AUTO', multiplier: 'AUTO', timeframe: initialTimeframe },
    autoRefresh: 'seconds_30',
  })
  const tm = useTorrentMetrics({
    buckets: { ...defaultBucketParams, timeframe: initialTimeframe },
    autoRefresh: 'seconds_30',
  })

  const [legend, setLegend] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(true)

  // AUTO bucket-duration heuristic: switch to finer resolution if there's less than 12 buckets of data
  // (webui/src/app/dashboard/queue/queue-visualize.component.ts ngOnInit).
  useEffect(() => {
    if (
      m.params.buckets.timeframe === 'all' &&
      m.params.buckets.duration === 'AUTO' &&
      m.result.params.buckets.duration === 'hour'
    ) {
      const span = m.result.bucketSpan
      if (span && span.latestBucket - span.earliestBucket < 12) {
        m.setBucketDuration('minute')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.result])

  // Turn auto-refresh off for both datasets when navigating away.
  useEffect(() => {
    return () => {
      m.setAutoRefreshInterval('off')
      tm.setAutoRefreshInterval('off')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The shared timeframe control never actually sets queue metrics to "all" (see initialTimeframe
  // above), so this cast just narrows a type queue metrics alone still allows for.
  const timeframeIndex = timeframeNames.indexOf(m.params.buckets.timeframe as TimeframeName)
  const durationIndex = resolutionNames.indexOf(m.bucketDuration)

  const timeline = buildQueueTimelineChart(m.result, t, i18n.language, legend)
  const totals = buildQueueTotalsChart(m.result, t, legend)
  const torrentTimeline = buildTorrentTimelineChart(tm.result, i18n.language, legend)

  // Timeframe/resolution/refresh apply to both datasets at once, so there's a single control
  // for each instead of one per dataset.
  const setTimeframe = (timeframe: TimeframeName) => {
    m.setTimeframe(timeframe)
    tm.setTimeframe(timeframe)
  }
  const setBucketDuration = (duration: MetricsBucketDuration, multiplier?: number) => {
    m.setBucketDuration(duration, multiplier)
    tm.setBucketDuration(duration, multiplier)
  }
  const setBucketMultiplier = (multiplier: number | 'AUTO') => {
    m.setBucketMultiplier(multiplier)
    tm.setBucketMultiplier(multiplier)
  }
  const setAutoRefreshInterval = (autoRefresh: AutoRefreshInterval) => {
    m.setAutoRefreshInterval(autoRefresh)
    tm.setAutoRefreshInterval(autoRefresh)
  }
  const refreshAll = () => {
    m.refresh()
    tm.refresh()
  }

  return (
    <div className="flex">
      {drawerOpen && (
        <div className="w-64 shrink-0 space-y-1 border-r border-border p-3">
          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <Clock className="size-4" />
              {t('dashboard.metrics.timeframe')}
            </div>
            <div className="pb-3">
              <Select value={m.params.buckets.timeframe} onValueChange={(v) => setTimeframe(v as never)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframeNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {t(`dashboard.interval.${name}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={timeframeIndex <= 0}
                  onClick={() => setTimeframe(timeframeNames[0])}
                >
                  <ChevronFirst className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={timeframeIndex <= 0}
                  onClick={() => setTimeframe(timeframeNames[timeframeIndex - 1])}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={timeframeIndex >= timeframeNames.length - 1}
                  onClick={() => setTimeframe(timeframeNames[timeframeIndex + 1])}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={timeframeIndex >= timeframeNames.length - 1}
                  onClick={() => setTimeframe(timeframeNames[timeframeNames.length - 1])}
                >
                  <ChevronLast className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <Ruler className="size-4" />
              {t('dashboard.metrics.resolution')}
            </div>
            <div className="pb-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder={String(m.result.params.buckets.multiplier)}
                  value={m.params.buckets.multiplier === 'AUTO' ? '' : m.params.buckets.multiplier}
                  onChange={(e) => {
                    const value = e.target.value
                    setBucketMultiplier(/^\d+$/.test(value) ? parseInt(value, 10) : 'AUTO')
                  }}
                  className="h-9 w-20 rounded-md border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Select value={m.bucketDuration} onValueChange={(v) => setBucketDuration(v as never)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {t(`dashboard.interval.${name}s`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={m.bucketMultiplier === 1}
                  onClick={() => setBucketMultiplier(m.bucketMultiplier - 1)}
                >
                  <Minus className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setBucketMultiplier(m.bucketMultiplier + 1)}>
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex <= 0}
                  onClick={() => setBucketDuration(resolutionNames[0])}
                >
                  <ChevronFirst className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex <= 0}
                  onClick={() => setBucketDuration(resolutionNames[durationIndex - 1])}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex >= resolutionNames.length - 1}
                  onClick={() => setBucketDuration(resolutionNames[durationIndex + 1])}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex >= resolutionNames.length - 1}
                  onClick={() => setBucketDuration(resolutionNames[resolutionNames.length - 1])}
                >
                  <ChevronLast className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <Boxes className="size-4" />
              {t('dashboard.queues.queue')}
            </div>
            <div className="pb-3">
              <Select value={m.params.queue ?? '_all'} onValueChange={(v) => m.setQueue(v === '_all' ? null : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('general.all')}</SelectItem>
                  {availableQueueNames.map((queue) => (
                    <SelectItem key={queue} value={queue}>
                      {queue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap items-center gap-0.5">
                <SimpleTooltip label={t('general.all')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(!m.params.queue && 'text-primary')}
                    onClick={() => m.setQueue(null)}
                  >
                    <Boxes className="size-4" />
                  </Button>
                </SimpleTooltip>
                {availableQueueNames.map((queue) => (
                  <SimpleTooltip key={queue} label={queue}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(m.params.queue === queue && 'text-primary')}
                      onClick={() => m.setQueue(queue)}
                    >
                      {m.params.queue === queue ? <CircleDot className="size-4" /> : <Circle className="size-4" />}
                    </Button>
                  </SimpleTooltip>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <CircleDot className="size-4" />
              {t('dashboard.metrics.queue_event')}
            </div>
            <div className="pb-3">
              <Select
                value={m.params.event ?? '_all'}
                onValueChange={(v) => m.setEvent(v === '_all' ? null : (v as never))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('general.all')}</SelectItem>
                  {queueEventNames.map((event) => (
                    <SelectItem key={event} value={event}>
                      {t(`dashboard.event.${event}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex items-center gap-0.5">
                <SimpleTooltip label={t('general.all')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(!m.params.event && 'text-primary')}
                    onClick={() => m.setEvent(null)}
                  >
                    <CircleDot className="size-4" />
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip label={t('dashboard.queues.created')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(m.params.event === 'created' && 'text-primary')}
                    onClick={() => m.setEvent('created')}
                  >
                    <CirclePlus className="size-4" />
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip label={t('dashboard.queues.processed')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(m.params.event === 'processed' && 'text-primary')}
                    onClick={() => m.setEvent('processed')}
                  >
                    <CircleCheck className="size-4" />
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip label={t('dashboard.queues.failed')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(m.params.event === 'failed' && 'text-primary')}
                    onClick={() => m.setEvent('failed')}
                  >
                    <CircleX className="size-4" />
                  </Button>
                </SimpleTooltip>
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <Database className="size-4" />
              {t('torrents.source')}
            </div>
            <div className="pb-3">
              <Select value={tm.params.source ?? '_all'} onValueChange={(v) => tm.setSource(v === '_all' ? null : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('general.all')}</SelectItem>
                  {tm.result.availableSources.map((source) => (
                    <SelectItem key={source.key} value={source.key}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap items-center gap-0.5">
                <SimpleTooltip label={t('general.all')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(!tm.params.source && 'text-primary')}
                    onClick={() => tm.setSource(null)}
                  >
                    <Boxes className="size-4" />
                  </Button>
                </SimpleTooltip>
                {['dht'].map((source) => (
                  <SimpleTooltip key={source} label={source}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(tm.params.source === source && 'text-primary')}
                      onClick={() => tm.setSource(source)}
                    >
                      {tm.params.source === source ? (
                        <CircleDot className="size-4" />
                      ) : (
                        <Circle className="size-4" />
                      )}
                    </Button>
                  </SimpleTooltip>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <CircleDot className="size-4" />
              {t('dashboard.metrics.torrent_event')}
            </div>
            <div className="pb-3">
              <Select
                value={tm.params.event ?? '_all'}
                onValueChange={(v) => tm.setEvent(v === '_all' ? null : (v as never))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('general.all')}</SelectItem>
                  {torrentEventNames.map((event) => (
                    <SelectItem key={event} value={event}>
                      {t(`dashboard.event.${event}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex items-center gap-0.5">
                <SimpleTooltip label={t('general.all')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(!tm.params.event && 'text-primary')}
                    onClick={() => tm.setEvent(null)}
                  >
                    <CircleDot className="size-4" />
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip label={t('dashboard.event.created')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(tm.params.event === 'created' && 'text-primary')}
                    onClick={() => tm.setEvent('created')}
                  >
                    <CirclePlus className="size-4" />
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip label={t('dashboard.event.updated')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(tm.params.event === 'updated' && 'text-primary')}
                    onClick={() => tm.setEvent('updated')}
                  >
                    <CircleCheck className="size-4" />
                  </Button>
                </SimpleTooltip>
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <RefreshCw className="size-4" />
              {t('general.refresh')}
            </div>
            <div className="pb-3">
              <Select value={m.params.autoRefresh} onValueChange={(v) => setAutoRefreshInterval(v as never)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {autoRefreshIntervalNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {t(`dashboard.interval.${name}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2 flex items-center gap-1">
                <SimpleTooltip label={t('general.refresh')}>
                  <Button variant="ghost" size="icon" onClick={refreshAll}>
                    <RefreshCw className="size-4" />
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip label={t('dashboard.metrics.toggle_legend')}>
                  <Button variant="ghost" size="icon" onClick={() => setLegend((l) => !l)}>
                    {legend ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
                </SimpleTooltip>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <SimpleTooltip label={t('torrents.toggle_drawer')}>
          <Button variant="ghost" size="icon" className="mb-3" onClick={() => setDrawerOpen((o) => !o)}>
            {drawerOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
          </Button>
        </SimpleTooltip>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-3">
            <h4 className="mb-2 text-sm font-semibold">{t('dashboard.queues.total_counts_by_status')}</h4>
            <div className="h-[400px]">
              <Bar data={totals.data} options={totals.options} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <h4 className="mb-2 text-sm font-semibold">{t('dashboard.metrics.queue_throughput')}</h4>
            <div className="h-[400px]">
              <Line data={timeline.data} options={timeline.options} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <h4 className="mb-2 text-sm font-semibold">{t('dashboard.metrics.torrent_throughput')}</h4>
            <div className="h-[400px]">
              <Line data={torrentTimeline.data} options={torrentTimeline.options} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
