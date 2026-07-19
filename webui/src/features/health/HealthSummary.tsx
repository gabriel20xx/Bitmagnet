import { useTranslation } from 'react-i18next'
import type { HealthResult } from './useHealth'

export function HealthSummary({ health }: { health: HealthResult }) {
  const { t } = useTranslation()

  if (health.error) {
    return (
      <p className="text-sm text-danger">
        {t('health.check_failed_with_error')}: {health.error.message}
      </p>
    )
  }

  const showError = health.status === 'down'

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-muted-fg">
          <th className="w-8" />
          <th className="py-1 font-medium">{t('health.component')}</th>
          <th className="py-1 font-medium">{t('general.status')}</th>
          {showError && <th className="py-1 font-medium">{t('general.error')}</th>}
        </tr>
      </thead>
      <tbody>
        {health.checks.map((check) => (
          <tr key={check.key} className="border-t border-border">
            <td className="py-1.5">
              <check.icon className="size-4" />
            </td>
            <th scope="row" className="py-1.5 font-normal">
              {t(`health.components.${check.key}`)}
            </th>
            <td className="py-1.5">{t(`health.statuses.${check.status}`)}</td>
            {showError && <td className="py-1.5 text-danger">{check.error}</td>}
          </tr>
        ))}
        {health.workers.map((worker) => (
          <tr key={worker.key} className="border-t border-border">
            <td className="py-1.5">
              <worker.icon className="size-4" />
            </td>
            <th scope="row" className="py-1.5 font-normal">
              {t('health.worker')}: {t(`health.workers.${worker.key}`)}
            </th>
            <td className="py-1.5">{t(`health.statuses.${worker.started ? 'started' : 'inactive'}`)}</td>
            {showError && <td className="py-1.5" />}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
