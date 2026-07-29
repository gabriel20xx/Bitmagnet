import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function FilterSidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-full shrink-0 border-b border-border p-3 min-[960px]:sticky min-[960px]:top-14 min-[960px]:max-h-[calc(100vh-3.5rem)] min-[960px]:w-64 min-[960px]:overflow-y-auto min-[960px]:border-b-0 min-[960px]:border-r">
      {children}
    </aside>
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
  options: { value: T; label: string; count: number }[]
  selected: Set<T>
  onToggle: (value: T) => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <section className="border-b border-border py-3 last:border-b-0">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4" />
        {label}
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-fg">{t('general.none')}</p>
      ) : (
        <ul className="space-y-1.5">
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
