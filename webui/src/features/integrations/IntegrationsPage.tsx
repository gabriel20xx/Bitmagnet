import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Plug, Plus, Power, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { addError } from '@/lib/toast/store'
import { UpdateIntegrationDocument, type IntegrationFragment, type IntegrationType } from '@/lib/graphql/generated'
import { FilterSidebar, FilterSidebarSection } from '@/features/dashboard/FilterSidebar'
import { toggleFilterValue, type FilterOption } from '@/features/dashboard/filterUtils'
import { useIntegrations } from './useIntegrations'
import { IntegrationRow } from './IntegrationRow'
import { IntegrationDialog } from './IntegrationDialog'
import { DeleteIntegrationDialog } from './DeleteIntegrationDialog'
import { integrationTypeLabels, integrationTypeList } from './integrationTypes'

type StatusFilterValue = 'enabled' | 'disabled'
const statusFilterValues: StatusFilterValue[] = ['enabled', 'disabled']

export function IntegrationsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.integrations'), t('routes.dashboard'))

  const { integrations, loading, refetch } = useIntegrations()
  const [updateIntegration] = useMutation(UpdateIntegrationDocument)

  const [editing, setEditing] = useState<IntegrationFragment | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<IntegrationFragment | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [typeFilter, setTypeFilter] = useState<Set<IntegrationType>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<StatusFilterValue>>(new Set())

  const toggleExpanded = (integration: IntegrationFragment) => {
    setExpandedId((prev) => (prev === integration.id ? null : integration.id))
  }

  const toggleEnabled = (integration: IntegrationFragment) => {
    updateIntegration({ variables: { id: integration.id, input: { enabled: !integration.enabled } } })
      .then(() => refetch())
      .catch((err: Error) => addError(err.message))
  }

  const passesType = (i: IntegrationFragment) => typeFilter.size === 0 || typeFilter.has(i.type)
  const passesStatus = (i: IntegrationFragment) =>
    statusFilter.size === 0 || statusFilter.has(i.enabled ? 'enabled' : 'disabled')

  const visibleIntegrations = integrations.filter((i) => passesType(i) && passesStatus(i))

  const typeOptions: FilterOption<IntegrationType>[] = integrationTypeList.map((type) => ({
    value: type,
    label: integrationTypeLabels[type],
    count: integrations.filter((i) => i.type === type && passesStatus(i)).length,
  }))

  const statusOptions: FilterOption<StatusFilterValue>[] = [
    {
      value: 'enabled',
      label: t('integrations.enabled'),
      count: integrations.filter((i) => i.enabled && passesType(i)).length,
    },
    {
      value: 'disabled',
      label: t('integrations.status_disabled'),
      count: integrations.filter((i) => !i.enabled && passesType(i)).length,
    },
  ]

  return (
    <div className="flex min-h-full">
      {drawerOpen && (
        <FilterSidebar>
          <FilterSidebarSection
            icon={Plug}
            label={t('facets.type')}
            options={typeOptions}
            selected={typeFilter}
            onToggle={(v) => setTypeFilter((s) => toggleFilterValue(s, integrationTypeList, v))}
          />
          <FilterSidebarSection
            icon={Power}
            label={t('facets.status')}
            options={statusOptions}
            selected={statusFilter}
            onToggle={(v) => setStatusFilter((s) => toggleFilterValue(s, statusFilterValues, v))}
          />
        </FilterSidebar>
      )}
      <div className="min-w-0 flex-1 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SimpleTooltip label={t('torrents.toggle_drawer')}>
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
            </Button>
          </SimpleTooltip>
          <Button type="button" size="sm" onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            {t('integrations.add_integration')}
          </Button>
        </div>

        {!loading && integrations.length === 0 ? (
          <p className="text-sm text-muted-fg">{t('integrations.none_configured')}</p>
        ) : !loading && visibleIntegrations.length === 0 ? (
          <p className="text-sm text-muted-fg">{t('general.no_matching_filters')}</p>
        ) : (
          <div className="rounded-lg border border-border bg-bg">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted-fg">
                  <th className="py-2 pl-3 font-medium">{t('integrations.status')}</th>
                  <th className="py-2 font-medium">{t('integrations.name')}</th>
                  <th className="py-2 font-medium">{t('integrations.type')}</th>
                  <th className="py-2 font-medium">{t('integrations.url')}</th>
                  <th className="py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {visibleIntegrations.map((integration) => (
                  <IntegrationRow
                    key={integration.id}
                    integration={integration}
                    expanded={expandedId === integration.id}
                    onToggleExpanded={toggleExpanded}
                    onToggleEnabled={toggleEnabled}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

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
    </div>
  )
}
