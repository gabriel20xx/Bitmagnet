import { NavLink, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Magnet, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { HealthWidget } from '@/features/health/HealthWidget'
import { ThemeToggle } from './ThemeToggle'
import { LanguageMenu } from './LanguageMenu'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover',
    isActive && 'bg-surface-hover text-primary',
  )

export function Header() {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-bg px-3">
      {isDesktop ? (
        <>
          <Link to="/torrents" className="flex items-center gap-2 pr-2 font-semibold">
            <Magnet className="size-5 text-primary" />
            <span>
              <span className="text-lg">B</span>itmagnet
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/torrents" className={navLinkClass}>
              <Magnet className="size-4" />
              {t('routes.torrents')}
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="size-4" />
              {t('routes.dashboard')}
            </NavLink>
          </nav>
        </>
      ) : (
        <>
          <Link to="/torrents" className="pr-1">
            <Magnet className="size-5 text-primary" />
          </Link>
          <SimpleTooltip label={t('routes.dashboard')}>
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard className="size-4" />
            </NavLink>
          </SimpleTooltip>
        </>
      )}

      <span className="flex-1" />

      <HealthWidget />
      <ThemeToggle />
      <LanguageMenu />
    </header>
  )
}
