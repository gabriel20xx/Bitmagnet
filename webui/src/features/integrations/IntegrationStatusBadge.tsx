import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils/cn'
import type { IntegrationFragment } from '@/lib/graphql/generated'
import { useIntegrationStatus } from './useIntegrationStatus'

const statusStyles = {
  checking: { dot: 'bg-muted-fg', text: 'text-muted-fg', labelKey: 'integrations.status_checking' },
  connected: { dot: 'bg-success', text: 'text-success', labelKey: 'integrations.status_connected' },
  disconnected: { dot: 'bg-danger', text: 'text-danger', labelKey: 'integrations.status_disconnected' },
  disabled: { dot: 'bg-muted-fg', text: 'text-muted-fg', labelKey: 'integrations.status_disabled' },
}

export function IntegrationStatusBadge({ integration }: { integration: IntegrationFragment }) {
  const { t } = useTranslation()
  const status = useIntegrationStatus(integration)
  const { dot, text, labelKey } = statusStyles[status]

  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 shrink-0 rounded-full', dot)} />
      <span className={text}>{t(labelKey)}</span>
    </span>
  )
}
