import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-border bg-bg px-4 py-3">
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  )
}

export function FilterBarSection<T extends string>({
  icon: Icon,
  label,
  options,
  selected,
  onToggle,
}: {
  icon: LucideIcon
  label: string
  options: { value: T; label: string; count: number }[]
  selected: Set<T>
  onToggle: (value: T) => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <section className="min-w-60 flex-1 rounded-md border border-border bg-surface p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4" />
        {label}
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-fg">{t('general.none')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {options.map((opt) => (
            <li key={opt.value} className="flex min-w-0 items-center gap-2 text-sm">
              <Checkbox
                checked={selected.size === 0 || selected.has(opt.value)}
                onCheckedChange={() => onToggle(opt.value)}
              />
              <span className="min-w-0 flex-1 truncate">{opt.label}</span>
              <small className="text-muted-fg">{opt.count.toLocaleString(i18n.language)}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
