import { useTranslation } from 'react-i18next'
import { formatFilesize } from '@/lib/utils/filesize'
import type { TorrentSearchControls } from './searchControls'

const BYTES_PER_MB = 1024 * 1024
const SIZE_MAX_DEFAULT_MB = 102400 // 100 GiB, expressed in megabytes
const SIZE_STEP_MB = 100

const mbToBytes = (mb: number) => mb * BYTES_PER_MB
const bytesToMb = (bytes: number) => Math.round(bytes / BYTES_PER_MB)

export function SizeFilter({
  controls,
  onUpdate,
}: {
  controls: TorrentSearchControls
  onUpdate: (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void
}) {
  const { t, i18n } = useTranslation()

  const sizeMinMb = controls.sizeMin != null ? bytesToMb(controls.sizeMin) : 0
  const sizeMaxMb = controls.sizeMax != null ? bytesToMb(controls.sizeMax) : SIZE_MAX_DEFAULT_MB

  const handleMinChange = (valueMb: number) => {
    const clampedMb = Math.min(Math.max(valueMb, 0), sizeMaxMb - SIZE_STEP_MB)
    onUpdate((c) => ({ ...c, sizeMin: clampedMb > 0 ? mbToBytes(clampedMb) : undefined, page: 1 }))
  }

  const handleMaxChange = (valueMb: number) => {
    const clampedMb = Math.max(Math.min(valueMb, SIZE_MAX_DEFAULT_MB), sizeMinMb + SIZE_STEP_MB)
    onUpdate((c) => ({ ...c, sizeMax: clampedMb < SIZE_MAX_DEFAULT_MB ? mbToBytes(clampedMb) : undefined, page: 1 }))
  }

  const clear = () => {
    onUpdate((c) => ({ ...c, sizeMin: undefined, sizeMax: undefined, page: 1 }))
  }

  const formatLabel = (mb: number) => formatFilesize(mbToBytes(mb), i18n.language)

  const hasFilter = controls.sizeMin != null || controls.sizeMax != null

  return (
    <div className="space-y-3 px-2">
      {hasFilter && (
        <div className="flex justify-end">
          <button onClick={clear} className="text-xs text-muted-fg hover:text-fg">
            {t('general.clear')}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_min')}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={SIZE_MAX_DEFAULT_MB}
                step={SIZE_STEP_MB}
                value={sizeMinMb}
                onChange={(e) => handleMinChange(parseInt(e.target.value, 10) || 0)}
                className="h-8 w-full rounded border border-border bg-bg px-2 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-fg">
                MB
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_max')}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={SIZE_MAX_DEFAULT_MB}
                step={SIZE_STEP_MB}
                value={sizeMaxMb}
                onChange={(e) => handleMaxChange(parseInt(e.target.value, 10) || 0)}
                className="h-8 w-full rounded border border-border bg-bg px-2 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-fg">
                MB
              </span>
            </div>
          </div>
        </div>

        <div className="relative h-6">
          <input
            type="range"
            min={0}
            max={SIZE_MAX_DEFAULT_MB}
            step={SIZE_STEP_MB}
            value={sizeMinMb}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="absolute left-0 top-1/2 z-10 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:shadow"
          />
          <input
            type="range"
            min={0}
            max={SIZE_MAX_DEFAULT_MB}
            step={SIZE_STEP_MB}
            value={sizeMaxMb}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="absolute left-0 top-1/2 z-10 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:shadow"
          />
          <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                marginLeft: `${(sizeMinMb / SIZE_MAX_DEFAULT_MB) * 100}%`,
                width: `${((sizeMaxMb - sizeMinMb) / SIZE_MAX_DEFAULT_MB) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-fg">
          <span>{formatLabel(0)}</span>
          <span>{formatLabel((sizeMinMb + sizeMaxMb) / 2)}</span>
          <span>{formatLabel(SIZE_MAX_DEFAULT_MB)}</span>
        </div>
      </div>
    </div>
  )
}
