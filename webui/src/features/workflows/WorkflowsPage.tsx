import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Workflow as WorkflowIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { addError } from '@/lib/toast/store'
import { UpdateWorkflowDocument, type WorkflowFragment } from '@/lib/graphql/generated'
import { useIntegrations } from '@/features/integrations/useIntegrations'
import { useWorkflows } from './useWorkflows'
import { WorkflowRow } from './WorkflowRow'
import { WorkflowDialog } from './WorkflowDialog'
import { DeleteWorkflowDialog } from './DeleteWorkflowDialog'

export function WorkflowsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.workflows'), t('routes.dashboard'))

  const { workflows, loading, refetch } = useWorkflows()
  const { integrations } = useIntegrations()
  const [updateWorkflow] = useMutation(UpdateWorkflowDocument)

  const [editing, setEditing] = useState<WorkflowFragment | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<WorkflowFragment | null>(null)

  const integrationName = (integrationId: string) =>
    integrations.find((i) => i.id === integrationId)?.name ?? integrationId

  const toggleEnabled = (workflow: WorkflowFragment) => {
    updateWorkflow({ variables: { id: workflow.id, input: { enabled: !workflow.enabled } } })
      .then(() => refetch())
      .catch((err: Error) => addError(err.message))
  }

  return (
    <div className="p-4">
      <div className="rounded-lg border border-border bg-bg">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <WorkflowIcon className="size-5" />
            {t('routes.workflows')}
          </h2>
          <Button type="button" size="sm" disabled={integrations.length === 0} onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            {t('workflows.add_workflow')}
          </Button>
        </div>
        <div className="p-4">
          {integrations.length === 0 && (
            <p className="mb-3 text-sm text-muted-fg">{t('workflows.needs_integration')}</p>
          )}
          {!loading && workflows.length === 0 ? (
            <p className="text-sm text-muted-fg">{t('workflows.none_configured')}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted-fg">
                  <th className="py-2 font-medium">{t('integrations.status')}</th>
                  <th className="py-2 font-medium">{t('workflows.name')}</th>
                  <th className="py-2 font-medium">{t('workflows.integration')}</th>
                  <th className="py-2 font-medium">{t('workflows.trigger')}</th>
                  <th className="py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <WorkflowRow
                    key={workflow.id}
                    workflow={workflow}
                    integrationName={integrationName(workflow.integrationId)}
                    onToggleEnabled={toggleEnabled}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <WorkflowDialog
          open={editing !== undefined}
          onOpenChange={(open) => !open && setEditing(undefined)}
          workflow={editing}
          integrations={integrations}
          onSaved={() => refetch()}
        />
        <DeleteWorkflowDialog
          workflow={deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          onDeleted={() => refetch()}
        />
      </div>
    </div>
  )
}
