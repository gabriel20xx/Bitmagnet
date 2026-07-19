import { NavLink, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ListTree, LineChart, ListChecks, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-fg transition-colors hover:text-fg',
    isActive && 'border-primary text-primary',
  )

export function QueueDashboardLayout() {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-border bg-bg">
      <div className="flex items-center gap-4 border-b border-border px-4">
        <h2 className="flex items-center gap-2 py-3 text-lg font-semibold">
          <ListTree className="size-5" />
          {t('routes.queues')}
        </h2>
        <nav className="flex gap-1">
          <NavLink to="visualize" className={tabClass}>
            <LineChart className="size-4" />
            {t('routes.visualize')}
          </NavLink>
          <NavLink to="jobs" className={tabClass}>
            <ListChecks className="size-4" />
            {t('routes.jobs')}
          </NavLink>
          <NavLink to="admin" className={tabClass}>
            <Wrench className="size-4" />
            {t('routes.admin')}
          </NavLink>
        </nav>
      </div>
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  )
}
