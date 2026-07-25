import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Power, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import type { IntegrationFragment } from '@/lib/graphql/generated'
import { integrationTypeLabels } from './integrationTypes'
import { IntegrationStatusBadge } from './IntegrationStatusBadge'
import { IntegrationActiveTorrentsPanel } from './IntegrationActiveTorrentsPanel'

const COLUMN_COUNT = 5

export function IntegrationRow({
  integration,
  expanded,
  onToggleExpanded,
  onToggleEnabled,
  onEdit,
  onDelete,
}: {
  integration: IntegrationFragment
  expanded: boolean
  onToggleExpanded: (integration: IntegrationFragment) => void
  onToggleEnabled: (integration: IntegrationFragment) => void
  onEdit: (integration: IntegrationFragment) => void
  onDelete: (integration: IntegrationFragment) => void
}) {
  const { t } = useTranslation()

  return (
    <Fragment>
      <tr
        onClick={() => onToggleExpanded(integration)}
        className={
          'cursor-pointer border-t border-border hover:bg-surface-hover ' + (expanded ? 'bg-surface-hover' : '')
        }
      >
        <td className="py-2 pl-3">
          <IntegrationStatusBadge integration={integration} />
        </td>
        <td className="py-2 font-medium">{integration.name}</td>
        <td className="py-2 text-muted-fg">{integrationTypeLabels[integration.type]}</td>
        <td className="py-2 text-muted-fg">{integration.url}</td>
        <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
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
      {expanded && (
        <tr className="border-t border-border bg-surface/50">
          <td colSpan={COLUMN_COUNT} className="p-4">
            <IntegrationActiveTorrentsPanel integrationId={integration.id} />
          </td>
        </tr>
      )}
    </Fragment>
  )
}
