import { useTranslation } from 'react-i18next'
import { useHealth } from './useHealth'
import { HealthSummary } from './HealthSummary'

export function HealthCard() {
  const { t } = useTranslation()
  const health = useHealth()
  const displayStatus = health.error ? 'down' : health.status

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <health.icon className="size-5" />
        {t('health.bitmagnet_is_status', { status: t(`health.statuses.${displayStatus}`) })}
      </h3>
      <HealthSummary health={health} />
    </div>
  )
}
