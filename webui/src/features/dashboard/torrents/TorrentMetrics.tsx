import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
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
  Eye,
  EyeOff,
  Clock,
  Ruler,
  Database,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import '@/lib/charting/chartSetup'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/cn'
import {
  autoRefreshIntervalNames,
  defaultBucketParams,
  eventNames,
  resolutionNames,
  timeframeNames,
} from './torrentMetricsConstants'
import { useTorrentMetrics } from './useTorrentMetrics'
import { buildTorrentTimelineChart } from './torrentChartAdapter'

// Port of webui/src/app/dashboard/torrents/torrent-metrics.component.ts/.html
//
// Note: the Angular template's "quick select" source buttons are hard-coded to a single `dht`
// entry (`@for (source of ["dht"]; ...)`), even though the dropdown above it is populated from
// `availableSources`. That's preserved verbatim here rather than "fixed" to use all sources.

export function TorrentMetrics() {
  const { t, i18n } = useTranslation()

  const m = useTorrentMetrics({ buckets: defaultBucketParams, autoRefresh: 'seconds_30' })
  const [legend, setLegend] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(true)

  useEffect(() => {
    return () => m.setAutoRefreshInterval('off')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const timeframeIndex = timeframeNames.indexOf(m.params.buckets.timeframe)
  const durationIndex = resolutionNames.indexOf(m.bucketDuration)
  const timeline = buildTorrentTimelineChart(m.result, i18n.language, legend)

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
              <Select value={m.params.buckets.timeframe} onValueChange={(v) => m.setTimeframe(v as never)}>
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
                  onClick={() => m.setTimeframe(timeframeNames[0])}
                >
                  <ChevronFirst className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={timeframeIndex <= 0}
                  onClick={() => m.setTimeframe(timeframeNames[timeframeIndex - 1])}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={timeframeIndex >= timeframeNames.length - 1}
                  onClick={() => m.setTimeframe(timeframeNames[timeframeIndex + 1])}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={timeframeIndex >= timeframeNames.length - 1}
                  onClick={() => m.setTimeframe(timeframeNames[timeframeNames.length - 1])}
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
                    m.setBucketMultiplier(/^\d+$/.test(value) ? parseInt(value, 10) : 'AUTO')
                  }}
                  className="h-9 w-20 rounded-md border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Select value={m.bucketDuration} onValueChange={(v) => m.setBucketDuration(v as never)}>
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
                  onClick={() => m.setBucketMultiplier(m.bucketMultiplier - 1)}
                >
                  <Minus className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => m.setBucketMultiplier(m.bucketMultiplier + 1)}>
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex <= 0}
                  onClick={() => m.setBucketDuration(resolutionNames[0])}
                >
                  <ChevronFirst className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex <= 0}
                  onClick={() => m.setBucketDuration(resolutionNames[durationIndex - 1])}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex >= resolutionNames.length - 1}
                  onClick={() => m.setBucketDuration(resolutionNames[durationIndex + 1])}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={durationIndex >= resolutionNames.length - 1}
                  onClick={() => m.setBucketDuration(resolutionNames[resolutionNames.length - 1])}
                >
                  <ChevronLast className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <Database className="size-4" />
              {t('torrents.source')}
            </div>
            <div className="pb-3">
              <Select value={m.params.source ?? '_all'} onValueChange={(v) => m.setSource(v === '_all' ? null : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{t('general.all')}</SelectItem>
                  {m.result.availableSources.map((source) => (
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
                    className={cn(!m.params.source && 'text-primary')}
                    onClick={() => m.setSource(null)}
                  >
                    <Boxes className="size-4" />
                  </Button>
                </SimpleTooltip>
                {['dht'].map((source) => (
                  <SimpleTooltip key={source} label={source}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(m.params.source === source && 'text-primary')}
                      onClick={() => m.setSource(source)}
                    >
                      {m.params.source === source ? <CircleDot className="size-4" /> : <Circle className="size-4" />}
                    </Button>
                  </SimpleTooltip>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex items-center gap-2 py-3 text-sm font-medium">
              <Activity className="size-4" />
              {t('dashboard.metrics.event')}
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
                  {eventNames.map((event) => (
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
                <SimpleTooltip label={t('dashboard.event.created')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(m.params.event === 'created' && 'text-primary')}
                    onClick={() => m.setEvent('created')}
                  >
                    <CirclePlus className="size-4" />
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip label={t('dashboard.event.updated')}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(m.params.event === 'updated' && 'text-primary')}
                    onClick={() => m.setEvent('updated')}
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
              <Select value={m.params.autoRefresh} onValueChange={(v) => m.setAutoRefreshInterval(v as never)}>
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
                  <Button variant="ghost" size="icon" onClick={m.refresh}>
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

      <div className="min-w-0 flex-1 p-4">
        <SimpleTooltip label={t('torrents.toggle_drawer')}>
          <Button variant="ghost" size="icon" className="mb-3" onClick={() => setDrawerOpen((o) => !o)}>
            {drawerOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
          </Button>
        </SimpleTooltip>

        <div className="rounded-lg border border-border bg-surface p-3">
          <h4 className="mb-2 text-sm font-semibold">{t('dashboard.metrics.throughput')}</h4>
          <div className="h-[400px]">
            <Line data={timeline.data} options={timeline.options} />
          </div>
        </div>
      </div>
    </div>
  )
}
