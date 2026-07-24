import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { addError } from '@/lib/toast/store'
import { DeleteIntegrationDocument, type IntegrationFragment } from '@/lib/graphql/generated'

export function DeleteIntegrationDialog({
  integration,
  onOpenChange,
  onDeleted,
}: {
  integration: IntegrationFragment | null
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const [deleteIntegration, { loading }] = useMutation(DeleteIntegrationDocument)

  const handleDelete = () => {
    if (!integration) return
    deleteIntegration({ variables: { id: integration.id } })
      .then(() => {
        onOpenChange(false)
        onDeleted()
      })
      .catch((err: Error) => addError(err.message))
  }

  return (
    <Dialog open={integration != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('integrations.delete_integration')}</DialogTitle>
        </DialogHeader>
        {integration && <p className="text-sm">{t('integrations.confirm_delete', { name: integration.name })}</p>}
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
