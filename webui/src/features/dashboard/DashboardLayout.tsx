import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, ListTree, Magnet, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-hover',
    isActive && 'bg-surface-hover text-primary',
  )

export function DashboardLayout() {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()
  const [open, setOpen] = useState(true)

  const showDrawer = open

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)]">
      {showDrawer && (
        <nav
          className={cn(
            'w-56 shrink-0 border-r border-border bg-surface/50 p-3',
            !isDesktop && 'fixed inset-y-14 left-0 z-30 bg-surface shadow-lg',
          )}
        >
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink to="/dashboard" end className={navItemClass}>
                <LayoutDashboard className="size-4" />
                {t('routes.home')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/queues" className={navItemClass}>
                <ListTree className="size-4" />
                {t('routes.queues')}
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/torrents" className={navItemClass}>
                <Magnet className="size-4" />
                {t('routes.torrents')}
              </NavLink>
            </li>
          </ul>
        </nav>
      )}
      <div className="min-w-0 flex-1 p-4">
        <SimpleTooltip label={t('torrents.toggle_drawer')}>
          <Button variant="ghost" size="icon" className="mb-2" onClick={() => setOpen((o) => !o)}>
            {open ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
          </Button>
        </SimpleTooltip>
        <Outlet />
      </div>
    </div>
  )
}
