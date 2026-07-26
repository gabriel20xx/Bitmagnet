import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import type { FilterOption } from './filterUtils'

export function FilterSidebar({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()

  if (!open) return null

  if (isDesktop) {
    return <div className="w-64 shrink-0 space-y-1 border-r border-border p-3">{children}</div>
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        role="button"
        tabIndex={0}
        aria-label={t('torrents.toggle_drawer')}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClose()
        }}
      />
      <div className="relative h-full w-72 max-w-[85vw] space-y-1 overflow-y-auto bg-bg p-3 shadow-lg">
        <div className="sticky -top-3 z-10 -mx-3 -mt-3 mb-1 flex justify-end border-b border-border bg-bg p-1">
          <Button variant="ghost" size="icon" aria-label={t('torrents.toggle_drawer')} onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FilterSidebarSection<T extends string>({
  icon: Icon,
  label,
  options,
  selected,
  onToggle,
}: {
  icon: LucideIcon
  label: string
  options: FilterOption<T>[]
  selected: Set<T>
  onToggle: (value: T) => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-2 py-3 text-sm font-medium">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="pb-3">
        {options.length === 0 ? (
          <p className="px-2 text-sm text-muted-fg">{t('general.none')}</p>
        ) : (
          <ul className="space-y-1.5">
            {options.map((opt) => (
              <li key={opt.value} className="flex items-center gap-2 px-2 text-sm">
                <Checkbox
                  checked={selected.size === 0 || selected.has(opt.value)}
                  onCheckedChange={() => onToggle(opt.value)}
                />
                <span className="flex-1 truncate">{opt.label}</span>
                <small className="text-muted-fg">{opt.count.toLocaleString(i18n.language)}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
