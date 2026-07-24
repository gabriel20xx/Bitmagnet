import { useTranslation } from 'react-i18next'
import { Pencil, Power, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import type { IntegrationFragment } from '@/lib/graphql/generated'
import { integrationTypeLabels } from './integrationTypes'
import { IntegrationStatusBadge } from './IntegrationStatusBadge'

export function IntegrationRow({
  integration,
  onToggleEnabled,
  onEdit,
  onDelete,
}: {
  integration: IntegrationFragment
  onToggleEnabled: (integration: IntegrationFragment) => void
  onEdit: (integration: IntegrationFragment) => void
  onDelete: (integration: IntegrationFragment) => void
}) {
  const { t } = useTranslation()

  return (
    <tr className="border-t border-border">
      <td className="py-2">
        <IntegrationStatusBadge integration={integration} />
      </td>
      <td className="py-2 font-medium">{integration.name}</td>
      <td className="py-2 text-muted-fg">{integrationTypeLabels[integration.type]}</td>
      <td className="py-2 text-muted-fg">{integration.url}</td>
      <td className="py-2 text-right">
        <SimpleTooltip label={t(integration.enabled ? 'integrations.disable' : 'integrations.enable')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={integration.enabled ? 'text-primary' : undefined}
            onClick={() => onToggleEnabled(integration)}
          >
            <Power className="size-4" />
          </Button>
        </SimpleTooltip>
        <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(integration)}>
          <Pencil className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(integration)}>
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  )
}
