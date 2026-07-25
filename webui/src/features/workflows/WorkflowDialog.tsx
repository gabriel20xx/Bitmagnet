import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addError } from '@/lib/toast/store'
import {
  CreateWorkflowDocument,
  UpdateWorkflowDocument,
  type ContentType,
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

export function WorkflowDialog({
  open,
  onOpenChange,
  workflow,
  integrations,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow?: WorkflowFragment | null
  integrations: IntegrationFragment[]
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const isEdit = workflow != null

  const [name, setName] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [integrationId, setIntegrationId] = useState('')
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

  const [create, { loading: creating }] = useMutation(CreateWorkflowDocument)
  const [update, { loading: updating }] = useMutation(UpdateWorkflowDocument)
  const saving = creating || updating

  useEffect(() => {
    if (!open) return

    setName(workflow?.name ?? '')
    setEnabled(workflow?.enabled ?? true)
    setIntegrationId(workflow?.integrationId ?? integrations[0]?.id ?? '')
    setMatchOnRematch(workflow?.matchOnRematch ?? false)
    setContentTypes(workflow?.criteria.contentTypes ?? [])
    setVideoResolutions(workflow?.criteria.videoResolutions ?? [])
    setVideoSources(workflow?.criteria.videoSources ?? [])
    setGenresText(workflow?.criteria.genres?.join(', ') ?? '')
    setLanguagesText(workflow?.criteria.languages?.join(', ') ?? '')
    setTitlePatternsText(workflow?.criteria.titlePatterns?.join('\n') ?? '')
    setSizeMinGb(workflow?.criteria.sizeMin != null ? String(bytesToGb(workflow.criteria.sizeMin)) : '')
    setSizeMaxGb(workflow?.criteria.sizeMax != null ? String(bytesToGb(workflow.criteria.sizeMax)) : '')
    setMinSeeders(workflow?.criteria.minSeeders != null ? String(workflow.criteria.minSeeders) : '')
  }, [open, workflow, integrations])

  const canSave = name.trim().length > 0 && integrationId.length > 0

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

    const mutation = isEdit
      ? update({ variables: { id: workflow.id, input: { name, enabled, integrationId, matchOnRematch, criteria } } })
      : create({ variables: { input: { name, enabled, integrationId, matchOnRematch, criteria } } })

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

          <div>
            <label className="mb-1 block text-sm font-medium">{t('workflows.integration')}</label>
            <Select value={integrationId} onValueChange={setIntegrationId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('workflows.select_integration')} />
              </SelectTrigger>
              <SelectContent>
                {integrations.map((integration) => (
                  <SelectItem key={integration.id} value={integration.id}>
                    {integration.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={enabled} onCheckedChange={(checked) => setEnabled(!!checked)} />
            {t('integrations.enabled')}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={matchOnRematch} onCheckedChange={(checked) => setMatchOnRematch(!!checked)} />
            {t('workflows.match_on_rematch')}
          </label>

          <div className="border-t border-border pt-3">
            <h3 className="mb-2 text-sm font-semibold">{t('workflows.criteria')}</h3>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-fg">{t('workflows.content_types')}</label>
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
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-fg">{t('workflows.video_resolutions')}</label>
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
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-fg">{t('workflows.video_sources')}</label>
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
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-fg">{t('workflows.genres')}</label>
              <input
                className={inputClass}
                value={genresText}
                onChange={(e) => setGenresText(e.target.value)}
                placeholder={t('workflows.genres_hint')}
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-fg">{t('workflows.languages')}</label>
              <input
                className={inputClass}
                value={languagesText}
                onChange={(e) => setLanguagesText(e.target.value)}
                placeholder={t('workflows.languages_hint')}
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-fg">{t('workflows.title_patterns')}</label>
              <textarea
                className={`${inputClass} h-20 resize-y py-1.5`}
                value={titlePatternsText}
                onChange={(e) => setTitlePatternsText(e.target.value)}
                placeholder={t('workflows.title_patterns_hint')}
              />
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-fg">{t('torrents.size_min')}</label>
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
                <label className="mb-1 block text-xs font-medium text-muted-fg">{t('torrents.size_max')}</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={sizeMaxGb}
                  onChange={(e) => setSizeMaxGb(e.target.value)}
                  placeholder="GB"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-fg">{t('workflows.min_seeders')}</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={minSeeders}
                  onChange={(e) => setMinSeeders(e.target.value)}
                />
              </div>
            </div>
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
