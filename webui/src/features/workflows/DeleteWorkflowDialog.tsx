import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { addError } from '@/lib/toast/store'
import { DeleteWorkflowDocument, type WorkflowFragment } from '@/lib/graphql/generated'

export function DeleteWorkflowDialog({
  workflow,
  onOpenChange,
  onDeleted,
}: {
  workflow: WorkflowFragment | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const [deleteWorkflow, { loading }] = useMutation(DeleteWorkflowDocument)

  const handleDelete = () => {
    if (!workflow) return
    deleteWorkflow({ variables: { id: workflow.id } })
      .then(() => {
        onOpenChange(false)
        onDeleted()
      })
      .catch((err: Error) => addError(err.message))
  }

  return (
    <Dialog open={workflow != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('workflows.delete_workflow')}</DialogTitle>
        </DialogHeader>
        {workflow && <p className="text-sm">{t('workflows.confirm_delete', { name: workflow.name })}</p>}
        <DialogFooter>
          <Button type="button" variant="danger" disabled={loading} onClick={handleDelete}>
            {t('general.delete')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
