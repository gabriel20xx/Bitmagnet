import { useTranslation } from 'react-i18next'
import { formatFilesize } from '@/lib/utils/filesize'
import type { TorrentSearchControls } from './searchControls'

const BYTES_PER_GB = 1_000_000_000 // decimal GB (SI), not the binary GiB (1024^3)
// Purely the slider's initial visual scale, not an enforced ceiling — it grows to fit
// whatever value is typed into the max field, so there's no artificial upper limit.
const DEFAULT_SLIDER_MAX_GB = 1000
const SIZE_STEP_GB = 1

const gbToBytes = (gb: number) => Math.round(gb * BYTES_PER_GB)
const bytesToGb = (bytes: number) => Math.round((bytes / BYTES_PER_GB) * 100) / 100

export function SizeFilter({
  controls,
  onUpdate,
}: {
  controls: TorrentSearchControls
  onUpdate: (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void
}) {
  const { t, i18n } = useTranslation()

  const sizeMinGb = controls.sizeMin != null ? bytesToGb(controls.sizeMin) : 0
  const sizeMaxGb = controls.sizeMax != null ? bytesToGb(controls.sizeMax) : null

  // Grows to fit the current min/max so a manually typed large value is never clipped.
  const sliderMaxGb = Math.max(DEFAULT_SLIDER_MAX_GB, sizeMinGb + SIZE_STEP_GB, sizeMaxGb ?? 0)

  const handleMinChange = (valueGb: number) => {
    const flooredGb = Math.max(valueGb, 0)
    const boundedGb = sizeMaxGb != null ? Math.min(flooredGb, sizeMaxGb - SIZE_STEP_GB) : flooredGb
    onUpdate((c) => ({ ...c, sizeMin: boundedGb > 0 ? gbToBytes(boundedGb) : undefined, page: 1 }))
  }

  // Used by the free-form number input: no upper bound, and an empty value means "no limit".
  const handleMaxInputChange = (rawValue: string) => {
    if (rawValue === '') {
      onUpdate((c) => ({ ...c, sizeMax: undefined, page: 1 }))

      return
    }

    const valueGb = Number(rawValue)
    if (Number.isNaN(valueGb)) return

    const boundedGb = Math.max(valueGb, sizeMinGb + SIZE_STEP_GB)
    onUpdate((c) => ({ ...c, sizeMax: gbToBytes(boundedGb), page: 1 }))
  }

  // Used by the range slider: dragging all the way to the right means "no limit".
  const handleMaxSliderChange = (valueGb: number) => {
    const boundedGb = Math.max(valueGb, sizeMinGb + SIZE_STEP_GB)
    onUpdate((c) => ({ ...c, sizeMax: boundedGb >= sliderMaxGb ? undefined : gbToBytes(boundedGb), page: 1 }))
  }

  const formatLabel = (gb: number) => formatFilesize(gbToBytes(gb), i18n.language, 10)

  return (
    <div className="px-2">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_min')}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={SIZE_STEP_GB}
                value={sizeMinGb}
                onChange={(e) => handleMinChange(Number(e.target.value) || 0)}
                className="h-8 w-full rounded border border-border bg-bg px-2 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-fg">
                GB
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_max')}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={SIZE_STEP_GB}
                placeholder={t('torrents.no_limit')}
                value={sizeMaxGb ?? ''}
                onChange={(e) => handleMaxInputChange(e.target.value)}
                className="h-8 w-full rounded border border-border bg-bg px-2 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-fg">
                GB
              </span>
            </div>
          </div>
        </div>

        <div className="relative h-6">
          <input
            type="range"
            min={0}
            max={sliderMaxGb}
            step={SIZE_STEP_GB}
            value={sizeMinGb}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="absolute left-0 top-1/2 z-10 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:shadow"
          />
          <input
            type="range"
            min={0}
            max={sliderMaxGb}
            step={SIZE_STEP_GB}
            value={sizeMaxGb ?? sliderMaxGb}
            onChange={(e) => handleMaxSliderChange(Number(e.target.value))}
            className="absolute left-0 top-1/2 z-10 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:shadow"
          />
          <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                marginLeft: `${(sizeMinGb / sliderMaxGb) * 100}%`,
                width: `${(((sizeMaxGb ?? sliderMaxGb) - sizeMinGb) / sliderMaxGb) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-fg">
          <span>{formatLabel(0)}</span>
          <span>{formatLabel((sizeMinGb + (sizeMaxGb ?? sliderMaxGb)) / 2)}</span>
          <span>{sizeMaxGb != null ? formatLabel(sizeMaxGb) : t('torrents.no_limit')}</span>
        </div>
      </div>
    </div>
  )
}
