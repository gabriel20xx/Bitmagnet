import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { HealthCard } from '@/features/health/HealthCard'
import { DatabaseStatsCard } from './DatabaseStatsCard'

export function DashboardHome() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.dashboard'))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DatabaseStatsCard />
      <HealthCard />
    </div>
  )
}
