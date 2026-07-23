import { useTranslation } from 'react-i18next'
import { formatFilesize } from '@/lib/utils/filesize'
import type { TorrentSearchControls } from './searchControls'

const SIZE_MAX_DEFAULT = 107374182400
const SIZE_STEP = 1073741824

export function SizeFilter({
  controls,
  onUpdate,
}: {
  controls: TorrentSearchControls
  onUpdate: (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void
}) {
  const { t, i18n } = useTranslation()

  const sizeMin = controls.sizeMin ?? 0
  const sizeMax = controls.sizeMax ?? SIZE_MAX_DEFAULT

  const handleMinChange = (value: number) => {
    const clamped = Math.min(value, (controls.sizeMax ?? SIZE_MAX_DEFAULT) - SIZE_STEP)
    onUpdate((c) => ({ ...c, sizeMin: clamped > 0 ? clamped : undefined, page: 1 }))
  }

  const handleMaxChange = (value: number) => {
    const clamped = Math.max(value, (controls.sizeMin ?? 0) + SIZE_STEP)
    onUpdate((c) => ({ ...c, sizeMax: clamped < SIZE_MAX_DEFAULT ? clamped : undefined, page: 1 }))
  }

  const clear = () => {
    onUpdate((c) => ({ ...c, sizeMin: undefined, sizeMax: undefined, page: 1 }))
  }

  const formatLabel = (value: number) => formatFilesize(value, i18n.language)

  const hasFilter = controls.sizeMin != null || controls.sizeMax != null

  return (
    <div className="space-y-3 px-2 py-1">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{t('torrents.size')}</span>
        {hasFilter && (
          <button onClick={clear} className="text-xs text-muted-fg hover:text-fg">
            {t('general.clear')}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_min')}</label>
            <input
              type="number"
              min={0}
              max={SIZE_MAX_DEFAULT}
              step={SIZE_STEP}
              value={sizeMin}
              onChange={(e) => handleMinChange(parseInt(e.target.value, 10) || 0)}
              className="h-8 w-full rounded border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_max')}</label>
            <input
              type="number"
              min={0}
              max={SIZE_MAX_DEFAULT}
              step={SIZE_STEP}
              value={sizeMax}
              onChange={(e) => handleMaxChange(parseInt(e.target.value, 10) || 0)}
              className="h-8 w-full rounded border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="relative h-6">
          <input
            type="range"
            min={0}
            max={SIZE_MAX_DEFAULT}
            step={SIZE_STEP}
            value={sizeMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            className="absolute left-0 top-1/2 z-10 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:shadow"
          />
          <input
            type="range"
            min={0}
            max={SIZE_MAX_DEFAULT}
            step={SIZE_STEP}
            value={sizeMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            className="absolute left-0 top-1/2 z-10 h-2 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:shadow"
          />
          <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                marginLeft: `${(sizeMin / SIZE_MAX_DEFAULT) * 100}%`,
                width: `${((sizeMax - sizeMin) / SIZE_MAX_DEFAULT) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-fg">
          <span>{formatLabel(0)}</span>
          <span>{formatLabel((sizeMin + sizeMax) / 2)}</span>
          <span>{formatLabel(SIZE_MAX_DEFAULT)}</span>
        </div>
      </div>
    </div>
  )
}
