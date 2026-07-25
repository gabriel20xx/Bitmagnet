import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { FilterOption } from './filterUtils'

export function FilterSidebar({ children }: { children: React.ReactNode }) {
  return <div className="w-64 shrink-0 space-y-1 border-r border-border p-3">{children}</div>
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
