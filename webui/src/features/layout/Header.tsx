import { NavLink, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Files, LineChart, ListChecks, Magnet, Plug, Workflow, Wrench, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { HealthWidget } from '@/features/health/HealthWidget'
import { DatabaseStatsWidget } from '@/features/dashboard/DatabaseStatsWidget'
import { ThemeToggle } from './ThemeToggle'
import { LanguageMenu } from './LanguageMenu'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover',
    isActive && 'bg-surface-hover text-primary',
  )

interface NavItem {
  to: string
  end?: boolean
  icon: LucideIcon
  labelKey: string
}

const navItems: NavItem[] = [
  { to: '/torrents', icon: Files, labelKey: 'routes.torrents' },
  { to: '/dashboard/metrics', icon: LineChart, labelKey: 'routes.metrics' },
  { to: '/dashboard/jobs', icon: ListChecks, labelKey: 'routes.jobs' },
  { to: '/dashboard/integrations', icon: Plug, labelKey: 'routes.integrations' },
  { to: '/dashboard/workflows', icon: Workflow, labelKey: 'routes.workflows' },
  { to: '/dashboard/admin', icon: Wrench, labelKey: 'routes.settings' },
]

export function Header() {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-bg px-3">
      <Link to="/torrents" className="flex shrink-0 items-center gap-2 pr-1 font-semibold">
        <Magnet className="size-5 text-primary" />
        {isDesktop && <span>Bitmagnet</span>}
      </Link>
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) =>
          isDesktop ? (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </NavLink>
          ) : (
            <SimpleTooltip key={item.to} label={t(item.labelKey)}>
              <NavLink to={item.to} end={item.end} className={navLinkClass}>
                <item.icon className="size-4" />
              </NavLink>
            </SimpleTooltip>
          ),
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-1">
        <DatabaseStatsWidget />
        <HealthWidget />
        <ThemeToggle />
        <LanguageMenu />
      </div>
    </header>
  )
}
