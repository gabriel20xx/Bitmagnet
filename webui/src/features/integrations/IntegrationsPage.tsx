import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Plug, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { addError } from '@/lib/toast/store'
import { UpdateIntegrationDocument, type IntegrationFragment } from '@/lib/graphql/generated'
import { useIntegrations } from './useIntegrations'
import { IntegrationRow } from './IntegrationRow'
import { IntegrationDialog } from './IntegrationDialog'
import { DeleteIntegrationDialog } from './DeleteIntegrationDialog'

export function IntegrationsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.integrations'), t('routes.dashboard'))

  const { integrations, loading, refetch } = useIntegrations()
  const [updateIntegration] = useMutation(UpdateIntegrationDocument)

  const [editing, setEditing] = useState<IntegrationFragment | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IntegrationFragment | null>(null)

  const toggleEnabled = (integration: IntegrationFragment) => {
    updateIntegration({ variables: { id: integration.id, input: { enabled: !integration.enabled } } })
      .then(() => refetch())
      .catch((err: Error) => addError(err.message))
  }

  return (
    <div className="rounded-lg border border-border bg-bg">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Plug className="size-5" />
          {t('routes.integrations')}
        </h2>
        <Button type="button" size="sm" onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          {t('integrations.add_integration')}
        </Button>
      </div>
      <div className="p-4">
        {loading && <div className="mb-2 h-0.5 w-full animate-pulse bg-primary" />}
        {!loading && integrations.length === 0 ? (
          <p className="text-sm text-muted-fg">{t('integrations.none_configured')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted-fg">
                <th className="py-2 font-medium">{t('integrations.name')}</th>
                <th className="py-2 font-medium">{t('integrations.type')}</th>
                <th className="py-2 font-medium">{t('integrations.url')}</th>
                <th className="py-2 text-center font-medium">{t('integrations.enabled')}</th>
                <th className="py-2 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <IntegrationRow
                  key={integration.id}
                  integration={integration}
                  onToggleEnabled={toggleEnabled}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <IntegrationDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        integration={editing}
        onSaved={() => refetch()}
      />
      <DeleteIntegrationDialog
        integration={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => refetch()}
      />
    </div>
  )
}
