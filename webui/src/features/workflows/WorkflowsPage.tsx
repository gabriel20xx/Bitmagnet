import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Plug, Plus, Power, Star, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { addError } from '@/lib/toast/store'
import { UpdateWorkflowDocument, type IntegrationType, type WorkflowFragment } from '@/lib/graphql/generated'
import { useIntegrations } from '@/features/integrations/useIntegrations'
import { integrationTypeLabels, integrationTypeList } from '@/features/integrations/integrationTypes'
import { useFavoritesLists } from '@/features/torrents/useFavoritesLists'
import { FilterSidebar, FilterSidebarSection } from '@/features/dashboard/FilterSidebar'
import { toggleFilterValue, type FilterOption } from '@/features/dashboard/filterUtils'
import { useWorkflows } from './useWorkflows'
import { WorkflowRow } from './WorkflowRow'
import { WorkflowDialog } from './WorkflowDialog'
import { DeleteWorkflowDialog } from './DeleteWorkflowDialog'

type StatusFilterValue = 'enabled' | 'disabled'
const statusFilterValues: StatusFilterValue[] = ['enabled', 'disabled']

export function WorkflowsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.workflows'), t('routes.dashboard'))
  const isDesktop = useIsDesktop()

  const { workflows, loading, refetch } = useWorkflows()
  const { integrations } = useIntegrations()
  const { lists: favoritesLists } = useFavoritesLists()
  const [updateWorkflow] = useMutation(UpdateWorkflowDocument)

  const [editing, setEditing] = useState<WorkflowFragment | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<WorkflowFragment | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(isDesktop)
  const [typeFilter, setTypeFilter] = useState<Set<IntegrationType>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Set<StatusFilterValue>>(new Set())
  const [favoritesListFilter, setFavoritesListFilter] = useState<Set<string>>(new Set())

  const canAddWorkflow = integrations.length > 0 || favoritesLists.length > 0

  const targetLabel = (workflow: WorkflowFragment) => {
    const labels: string[] = []
    if (workflow.integrationId) {
      labels.push(integrations.find((i) => i.id === workflow.integrationId)?.name ?? workflow.integrationId)
    }
    if (workflow.favoritesListId) {
      labels.push(favoritesLists.find((l) => l.id === workflow.favoritesListId)?.name ?? workflow.favoritesListId)
    }
    return labels.join(' + ')
  }

  const toggleEnabled = (workflow: WorkflowFragment) => {
    updateWorkflow({ variables: { id: workflow.id, input: { enabled: !workflow.enabled } } })
      .then(() => refetch())
      .catch((err: Error) => addError(err.message))
  }

  const workflowIntegrationType = (w: WorkflowFragment): IntegrationType | undefined =>
    w.integrationId ? integrations.find((i) => i.id === w.integrationId)?.type : undefined

  const passesType = (w: WorkflowFragment) => {
    if (typeFilter.size === 0) return true
    const type = workflowIntegrationType(w)
    return type != null && typeFilter.has(type)
  }
  const passesStatus = (w: WorkflowFragment) =>
    statusFilter.size === 0 || statusFilter.has(w.enabled ? 'enabled' : 'disabled')
  const passesFavoritesList = (w: WorkflowFragment) =>
    favoritesListFilter.size === 0 || (!!w.favoritesListId && favoritesListFilter.has(w.favoritesListId))

  const visibleWorkflows = workflows.filter((w) => passesType(w) && passesStatus(w) && passesFavoritesList(w))

  const typeOptions: FilterOption<IntegrationType>[] = integrationTypeList.map((type) => ({
    value: type,
    label: integrationTypeLabels[type],
    count: workflows.filter((w) => workflowIntegrationType(w) === type && passesStatus(w) && passesFavoritesList(w))
      .length,
  }))

  const statusOptions: FilterOption<StatusFilterValue>[] = [
    {
      value: 'enabled',
      label: t('integrations.enabled'),
      count: workflows.filter((w) => w.enabled && passesType(w) && passesFavoritesList(w)).length,
    },
    {
      value: 'disabled',
      label: t('integrations.status_disabled'),
      count: workflows.filter((w) => !w.enabled && passesType(w) && passesFavoritesList(w)).length,
    },
  ]

  const favoritesListOptions: FilterOption<string>[] = favoritesLists.map((list) => ({
    value: list.id,
    label: list.name,
    count: workflows.filter((w) => w.favoritesListId === list.id && passesType(w) && passesStatus(w)).length,
  }))

  return (
    <div className="flex flex-1">
      <FilterSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)}>
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
        <FilterSidebarSection
          icon={Star}
          label={t('facets.favorites_list')}
          options={favoritesListOptions}
          selected={favoritesListFilter}
          onToggle={(v) =>
            setFavoritesListFilter((s) =>
              toggleFilterValue(
                s,
                favoritesLists.map((l) => l.id),
                v,
              ),
            )
          }
        />
      </FilterSidebar>
      <div className="min-w-0 flex-1 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SimpleTooltip label={t('torrents.toggle_drawer')}>
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen((o) => !o)}>
              {drawerOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
            </Button>
          </SimpleTooltip>
          <Button type="button" size="sm" disabled={!canAddWorkflow} onClick={() => setEditing(null)}>
            <Plus className="size-4" />
            {t('workflows.add_workflow')}
          </Button>
        </div>

        {!canAddWorkflow && <p className="mb-3 text-sm text-muted-fg">{t('workflows.needs_integration')}</p>}

        {!loading && workflows.length === 0 ? (
          <p className="text-sm text-muted-fg">{t('workflows.none_configured')}</p>
        ) : !loading && visibleWorkflows.length === 0 ? (
          <p className="text-sm text-muted-fg">{t('general.no_matching_filters')}</p>
        ) : (
          <div className="rounded-lg border border-border bg-bg">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted-fg">
                  <th className="py-2 pl-3 font-medium">{t('integrations.status')}</th>
                  <th className="py-2 font-medium">{t('workflows.name')}</th>
                  <th className="py-2 font-medium">{t('workflows.action')}</th>
                  <th className="py-2 font-medium">{t('workflows.trigger')}</th>
                  <th className="py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {visibleWorkflows.map((workflow) => (
                  <WorkflowRow
                    key={workflow.id}
                    workflow={workflow}
                    targetLabel={targetLabel(workflow)}
                    onToggleEnabled={toggleEnabled}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <WorkflowDialog
          open={editing !== undefined}
          onOpenChange={(open) => !open && setEditing(undefined)}
          workflow={editing}
          integrations={integrations}
          favoritesLists={favoritesLists}
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
