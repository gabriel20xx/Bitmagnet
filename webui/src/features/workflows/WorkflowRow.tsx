import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Pencil, Power, PlayCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { addError } from '@/lib/toast/store'
import { ApplyWorkflowToExistingDocument, type WorkflowFragment } from '@/lib/graphql/generated'

export function WorkflowRow({
  workflow,
  targetLabel,
  onToggleEnabled,
  onEdit,
  onDelete,
}: {
  workflow: WorkflowFragment
  targetLabel: string
  onToggleEnabled: (workflow: WorkflowFragment) => void
  onEdit: (workflow: WorkflowFragment) => void
  onDelete: (workflow: WorkflowFragment) => void
}) {
  const { t } = useTranslation()
  const [applyToExisting, { loading: applying }] = useMutation(ApplyWorkflowToExistingDocument)

  const handleApplyToExisting = () => {
    applyToExisting({ variables: { id: workflow.id } })
      .then(() => addError(t('workflows.apply_to_existing_started')))
      .catch((err: Error) => addError(err.message))
  }

  return (
    <tr className="border-t border-border">
      <td className="py-2 pl-3">
        <SimpleTooltip label={t(workflow.enabled ? 'integrations.disable' : 'integrations.enable')}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={workflow.enabled ? 'text-primary' : undefined}
            onClick={() => onToggleEnabled(workflow)}
          >
            <Power className="size-4" />
          </Button>
        </SimpleTooltip>
      </td>
      <td className="py-2 font-medium">{workflow.name}</td>
      <td className="py-2 text-muted-fg">{targetLabel}</td>
      <td className="py-2 text-muted-fg">
        {t(workflow.matchOnRematch ? 'workflows.match_mode_always' : 'workflows.match_mode_new_only')}
      </td>
      <td className="py-2 text-right">
        <SimpleTooltip label={t('workflows.apply_to_existing')}>
          <Button type="button" variant="ghost" size="icon" disabled={applying} onClick={handleApplyToExisting}>
            <PlayCircle className="size-4" />
          </Button>
        </SimpleTooltip>
        <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(workflow)}>
          <Pencil className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(workflow)}>
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  )
}
