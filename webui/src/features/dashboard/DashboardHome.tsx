import { useTranslation } from 'react-i18next'
import { LayoutDashboard } from 'lucide-react'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { HealthCard } from '@/features/health/HealthCard'
import { DatabaseStatsCard } from './DatabaseStatsCard'

export function DashboardHome() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.dashboard'))

  return (
    <div className="rounded-lg border border-border bg-bg">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <LayoutDashboard className="size-5" />
        <h2 className="text-lg font-semibold">{t('routes.dashboard')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <DatabaseStatsCard />
        <HealthCard />
      </div>
    </div>
  )
}
