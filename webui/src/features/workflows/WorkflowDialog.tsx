import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Plus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { addError } from '@/lib/toast/store'
import {
  CreateWorkflowDocument,
  UpdateWorkflowDocument,
  type ContentType,
  type FavoritesListFragment,
  type IntegrationFragment,
  type Language,
  type VideoResolution,
  type VideoSource,
  type WorkflowCriteriaInput,
  type WorkflowFragment,
} from '@/lib/graphql/generated'
import { contentTypeList } from '@/features/torrents/contentTypes'
import { videoResolutionLabel, videoResolutionOptions, videoSourceOptions } from './workflowCriteriaOptions'

const inputClass =
  'h-9 w-full rounded-md border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

const BYTES_PER_GB = 1_000_000_000
const gbToBytes = (gb: number) => Math.round(gb * BYTES_PER_GB)
const bytesToGb = (bytes: number) => Math.round((bytes / BYTES_PER_GB) * 100) / 100

function parseList(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  )
}

function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function SelectAllToggle<T>({
  allValues,
  selected,
  onChange,
}: {
  allValues: T[]
  selected: T[]
  onChange: (values: T[]) => void
}) {
  const { t } = useTranslation()
  const isAllSelected = allValues.length > 0 && allValues.every((v) => selected.includes(v))

  return (
    <button
      type="button"
      className="text-xs text-primary hover:underline"
      onClick={() => onChange(isAllSelected ? [] : allValues)}
    >
      {t(isAllSelected ? 'torrents.deselect_all' : 'torrents.select_all')}
    </button>
  )
}

function CheckboxChip({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean
  onCheckedChange: () => void
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} />
      {children}
    </label>
  )
}

const CRITERIA_KEYS = [
  'contentTypes',
  'videoResolutions',
  'videoSources',
  'genres',
  'languages',
  'titlePatterns',
  'size',
  'minSeeders',
] as const

type CriteriaKey = (typeof CRITERIA_KEYS)[number]

function CriteriaSection({
  label,
  action,
  onRemove,
  children,
}: {
  label: string
  action?: React.ReactNode
  onRemove: () => void
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-3 rounded-md border border-border p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-muted-fg">{label}</label>
        <div className="flex items-center gap-2">
          {action}
          <button
            type="button"
            className="text-muted-fg hover:text-fg"
            onClick={onRemove}
            aria-label={t('general.clear')}
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

const NONE = '_none'

export function WorkflowDialog({
  open,
  onOpenChange,
  workflow,
  integrations,
  favoritesLists,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow?: WorkflowFragment | null
  integrations: IntegrationFragment[]
  favoritesLists: FavoritesListFragment[]
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const isEdit = workflow != null

  const [name, setName] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [integrationId, setIntegrationId] = useState('')
  const [favoritesListId, setFavoritesListId] = useState('')
  const [matchOnRematch, setMatchOnRematch] = useState(false)
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [videoResolutions, setVideoResolutions] = useState<VideoResolution[]>([])
  const [videoSources, setVideoSources] = useState<VideoSource[]>([])
  const [genresText, setGenresText] = useState('')
  const [languagesText, setLanguagesText] = useState('')
  const [titlePatternsText, setTitlePatternsText] = useState('')
  const [sizeMinGb, setSizeMinGb] = useState('')
  const [sizeMaxGb, setSizeMaxGb] = useState('')
  const [minSeeders, setMinSeeders] = useState('')
  const [activeCriteria, setActiveCriteria] = useState<CriteriaKey[]>([])

  const [create, { loading: creating }] = useMutation(CreateWorkflowDocument)
  const [update, { loading: updating }] = useMutation(UpdateWorkflowDocument)
  const saving = creating || updating

  useEffect(() => {
    if (!open) return

    const criteria = workflow?.criteria
    setName(workflow?.name ?? '')
    setEnabled(workflow?.enabled ?? true)
    setIntegrationId(workflow?.integrationId ?? '')
    setFavoritesListId(workflow?.favoritesListId ?? '')
    setMatchOnRematch(workflow?.matchOnRematch ?? false)
    setContentTypes(criteria?.contentTypes ?? [])
    setVideoResolutions(criteria?.videoResolutions ?? [])
    setVideoSources(criteria?.videoSources ?? [])
    setGenresText(criteria?.genres?.join(', ') ?? '')
    setLanguagesText(criteria?.languages?.join(', ') ?? '')
    setTitlePatternsText(criteria?.titlePatterns?.join('\n') ?? '')
    setSizeMinGb(criteria?.sizeMin != null ? String(bytesToGb(criteria.sizeMin)) : '')
    setSizeMaxGb(criteria?.sizeMax != null ? String(bytesToGb(criteria.sizeMax)) : '')
    setMinSeeders(criteria?.minSeeders != null ? String(criteria.minSeeders) : '')
    setActiveCriteria(
      CRITERIA_KEYS.filter((key) => {
        switch (key) {
          case 'contentTypes':
            return !!criteria?.contentTypes?.length
          case 'videoResolutions':
            return !!criteria?.videoResolutions?.length
          case 'videoSources':
            return !!criteria?.videoSources?.length
          case 'genres':
            return !!criteria?.genres?.length
          case 'languages':
            return !!criteria?.languages?.length
          case 'titlePatterns':
            return !!criteria?.titlePatterns?.length
          case 'size':
            return criteria?.sizeMin != null || criteria?.sizeMax != null
          case 'minSeeders':
            return criteria?.minSeeders != null
        }
      }),
    )
  }, [open, workflow, integrations])

  const contentTypeKeys = contentTypeList.filter((ct) => ct.key !== 'null').map((ct) => ct.key as ContentType)

  const criteriaLabels: Record<CriteriaKey, string> = {
    contentTypes: t('workflows.content_types'),
    videoResolutions: t('workflows.video_resolutions'),
    videoSources: t('workflows.video_sources'),
    genres: t('workflows.genres'),
    languages: t('workflows.languages'),
    titlePatterns: t('workflows.title_patterns'),
    size: `${t('torrents.size_min')} / ${t('torrents.size_max')}`,
    minSeeders: t('workflows.min_seeders'),
  }

  const addCriteria = (key: CriteriaKey) => setActiveCriteria((prev) => (prev.includes(key) ? prev : [...prev, key]))

  const removeCriteria = (key: CriteriaKey) => {
    setActiveCriteria((prev) => prev.filter((k) => k !== key))
    switch (key) {
      case 'contentTypes':
        setContentTypes([])
        break
      case 'videoResolutions':
        setVideoResolutions([])
        break
      case 'videoSources':
        setVideoSources([])
        break
      case 'genres':
        setGenresText('')
        break
      case 'languages':
        setLanguagesText('')
        break
      case 'titlePatterns':
        setTitlePatternsText('')
        break
      case 'size':
        setSizeMinGb('')
        setSizeMaxGb('')
        break
      case 'minSeeders':
        setMinSeeders('')
        break
    }
  }

  const availableCriteria = CRITERIA_KEYS.filter((key) => !activeCriteria.includes(key))

  const canSave = name.trim().length > 0 && (integrationId.length > 0 || favoritesListId.length > 0)

  const handleSave = () => {
    if (!canSave || saving) return

    const criteria: WorkflowCriteriaInput = {
      contentTypes: contentTypes.length ? contentTypes : undefined,
      videoResolutions: videoResolutions.length ? videoResolutions : undefined,
      videoSources: videoSources.length ? videoSources : undefined,
      genres: parseList(genresText).length ? parseList(genresText) : undefined,
      languages: parseList(languagesText).length ? (parseList(languagesText) as Language[]) : undefined,
      titlePatterns: parseLines(titlePatternsText).length ? parseLines(titlePatternsText) : undefined,
      sizeMin: sizeMinGb.trim() ? gbToBytes(Number(sizeMinGb)) : undefined,
      sizeMax: sizeMaxGb.trim() ? gbToBytes(Number(sizeMaxGb)) : undefined,
      minSeeders: minSeeders.trim() ? Number(minSeeders) : undefined,
    }

    const input = {
      name,
      enabled,
      integrationId: integrationId || null,
      favoritesListId: favoritesListId || null,
      matchOnRematch,
      criteria,
    }

    const mutation = isEdit ? update({ variables: { id: workflow.id, input } }) : create({ variables: { input } })

    mutation
      .then(() => {
        onOpenChange(false)
        onSaved()
      })
      .catch((err: Error) => addError(err.message))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'workflows.edit_workflow' : 'workflows.add_workflow')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('workflows.name')}</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('workflows.integration')}</label>
              <Select value={integrationId || NONE} onValueChange={(v) => setIntegrationId(v === NONE ? '' : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('workflows.select_integration')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t('workflows.none')}</SelectItem>
                  {integrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">{t('workflows.favorites_list')}</label>
              <Select value={favoritesListId || NONE} onValueChange={(v) => setFavoritesListId(v === NONE ? '' : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('workflows.select_favorites_list')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t('workflows.none')}</SelectItem>
                  {favoritesLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!canSave && name.trim().length > 0 && <p className="text-xs text-danger">{t('workflows.needs_action')}</p>}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={enabled} onCheckedChange={(checked) => setEnabled(!!checked)} />
            {t('integrations.enabled')}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={matchOnRematch} onCheckedChange={(checked) => setMatchOnRematch(!!checked)} />
            {t('workflows.match_on_rematch')}
          </label>

          <div className="border-t border-border pt-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t('workflows.criteria')}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" disabled={availableCriteria.length === 0}>
                    <Plus className="size-3.5" />
                    {t('workflows.add_criteria')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableCriteria.map((key) => (
                    <DropdownMenuItem key={key} onSelect={() => addCriteria(key)}>
                      {criteriaLabels[key]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {activeCriteria.includes('contentTypes') && (
              <CriteriaSection
                label={criteriaLabels.contentTypes}
                onRemove={() => removeCriteria('contentTypes')}
                action={
                  <SelectAllToggle allValues={contentTypeKeys} selected={contentTypes} onChange={setContentTypes} />
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {contentTypeList
                    .filter((ct) => ct.key !== 'null')
                    .map((ct) => (
                      <CheckboxChip
                        key={ct.key}
                        checked={contentTypes.includes(ct.key as ContentType)}
                        onCheckedChange={() => setContentTypes((prev) => toggleIn(prev, ct.key as ContentType))}
                      >
                        {t(`content_types.plural.${ct.key}`)}
                      </CheckboxChip>
                    ))}
                </div>
              </CriteriaSection>
            )}

            {activeCriteria.includes('videoResolutions') && (
              <CriteriaSection
                label={criteriaLabels.videoResolutions}
                onRemove={() => removeCriteria('videoResolutions')}
                action={
                  <SelectAllToggle
                    allValues={videoResolutionOptions}
                    selected={videoResolutions}
                    onChange={setVideoResolutions}
                  />
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {videoResolutionOptions.map((vr) => (
                    <CheckboxChip
                      key={vr}
                      checked={videoResolutions.includes(vr)}
                      onCheckedChange={() => setVideoResolutions((prev) => toggleIn(prev, vr))}
                    >
                      {videoResolutionLabel(vr)}
                    </CheckboxChip>
                  ))}
                </div>
              </CriteriaSection>
            )}

            {activeCriteria.includes('videoSources') && (
              <CriteriaSection
                label={criteriaLabels.videoSources}
                onRemove={() => removeCriteria('videoSources')}
                action={
                  <SelectAllToggle allValues={videoSourceOptions} selected={videoSources} onChange={setVideoSources} />
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {videoSourceOptions.map((vs) => (
                    <CheckboxChip
                      key={vs}
                      checked={videoSources.includes(vs)}
                      onCheckedChange={() => setVideoSources((prev) => toggleIn(prev, vs))}
                    >
                      {vs}
                    </CheckboxChip>
                  ))}
                </div>
              </CriteriaSection>
            )}

            {activeCriteria.includes('genres') && (
              <CriteriaSection label={criteriaLabels.genres} onRemove={() => removeCriteria('genres')}>
                <input
                  className={inputClass}
                  value={genresText}
                  onChange={(e) => setGenresText(e.target.value)}
                  placeholder={t('workflows.genres_hint')}
                />
              </CriteriaSection>
            )}

            {activeCriteria.includes('languages') && (
              <CriteriaSection label={criteriaLabels.languages} onRemove={() => removeCriteria('languages')}>
                <input
                  className={inputClass}
                  value={languagesText}
                  onChange={(e) => setLanguagesText(e.target.value)}
                  placeholder={t('workflows.languages_hint')}
                />
              </CriteriaSection>
            )}

            {activeCriteria.includes('titlePatterns') && (
              <CriteriaSection label={criteriaLabels.titlePatterns} onRemove={() => removeCriteria('titlePatterns')}>
                <textarea
                  className={`${inputClass} h-20 resize-y py-1.5`}
                  value={titlePatternsText}
                  onChange={(e) => setTitlePatternsText(e.target.value)}
                  placeholder={t('workflows.title_patterns_hint')}
                />
              </CriteriaSection>
            )}

            {activeCriteria.includes('size') && (
              <CriteriaSection label={criteriaLabels.size} onRemove={() => removeCriteria('size')}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_min')}</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={sizeMinGb}
                      onChange={(e) => setSizeMinGb(e.target.value)}
                      placeholder="GB"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-fg">{t('torrents.size_max')}</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={sizeMaxGb}
                      onChange={(e) => setSizeMaxGb(e.target.value)}
                      placeholder="GB"
                    />
                  </div>
                </div>
              </CriteriaSection>
            )}

            {activeCriteria.includes('minSeeders') && (
              <CriteriaSection label={criteriaLabels.minSeeders} onRemove={() => removeCriteria('minSeeders')}>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={minSeeders}
                  onChange={(e) => setMinSeeders(e.target.value)}
                />
              </CriteriaSection>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" disabled={!canSave || saving} onClick={handleSave}>
            {t('general.save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
