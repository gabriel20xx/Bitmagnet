import { useTranslation } from 'react-i18next'
import { Check, Loader2, Pencil, PlugZap, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SimpleTooltip } from '@/components/ui/tooltip'
import type { IntegrationFragment } from '@/lib/graphql/generated'
import { integrationTypeLabels } from './integrationTypes'
import { useTestConnection } from './useTestConnection'

const statusIcon = {
  idle: <PlugZap className="size-4" />,
  testing: <Loader2 className="size-4 animate-spin" />,
  success: <Check className="size-4 text-primary" />,
  error: <X className="size-4 text-danger" />,
}

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
  const { status, testSaved } = useTestConnection()

  return (
    <tr className="border-t border-border">
      <td className="py-2 font-medium">{integration.name}</td>
      <td className="py-2 text-muted-fg">{integrationTypeLabels[integration.type]}</td>
      <td className="py-2 text-muted-fg">{integration.url}</td>
      <td className="py-2 text-center">
        <Checkbox
          className="mx-auto"
          checked={integration.enabled}
          onCheckedChange={() => onToggleEnabled(integration)}
        />
      </td>
      <td className="py-2 text-right">
        <SimpleTooltip label={t('integrations.test_connection')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={status === 'testing'}
            onClick={() => testSaved(integration.id)}
          >
            {statusIcon[status]}
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
