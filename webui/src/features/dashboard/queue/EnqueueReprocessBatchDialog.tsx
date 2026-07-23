import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { CircleSlash } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { addError } from '@/lib/toast/store'
import { QueueEnqueueReprocessTorrentsBatchDocument, type ContentType } from '@/lib/graphql/generated'
import { contentTypeList } from '@/features/torrents/contentTypes'

// Port of webui/src/app/dashboard/queue/queue-enqueue-reprocess-torrents-batch-dialog.component.ts/.html
//
// The Angular dialog uses a native multi-select (<mat-select multiple>) for content types; this
// app's Select primitive (Radix) is single-select only, so the equivalent control here is a
// checkbox list with the same "all" sentinel collapsing behavior (selecting a specific type
// deselects "all"; deselecting the last specific type reverts to "all").

type ContentTypeSelection = ContentType | 'null'
type Stage = 'PENDING' | 'REQUESTING' | 'DONE'

const allContentTypeKeys = contentTypeList.map((ct) => ct.key)

export function EnqueueReprocessBatchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [purge, setPurge] = useState(true)
  const [apisDisabled, setApisDisabled] = useState(true)
  const [localSearchDisabled, setLocalSearchDisabled] = useState(true)
  const [classifierRematch, setClassifierRematch] = useState(false)
  const [orphans, setOrphans] = useState(false)
  const [contentTypes, setContentTypes] = useState<Array<ContentTypeSelection | 'all'>>(['all'])
  const [stage, setStage] = useState<Stage>('PENDING')
  const [enqueue] = useMutation(QueueEnqueueReprocessTorrentsBatchDocument)

  const reset = () => {
    setPurge(true)
    setApisDisabled(true)
    setLocalSearchDisabled(true)
    setClassifierRematch(false)
    setOrphans(false)
    setContentTypes(['all'])
    setStage('PENDING')
  }

  const toggleContentType = (key: ContentTypeSelection, checked: boolean) => {
    setOrphans(false)
    setContentTypes((current) => {
      const withoutAll = current.filter((c): c is ContentTypeSelection => c !== 'all')
      const nextSet = new Set(withoutAll)
      if (checked) nextSet.add(key)
      else nextSet.delete(key)
      const next = allContentTypeKeys.filter((k) => nextSet.has(k))
      return next.length ? next : ['all']
    })
  }

  const handleEnqueue = () => {
    if (stage !== 'PENDING') return
    setStage('REQUESTING')
    enqueue({
      variables: {
        input: {
          purge,
          apisDisabled,
          localSearchDisabled,
          classifierRematch,
          contentTypes: contentTypes.includes('all')
            ? undefined
            : (contentTypes as ContentTypeSelection[]).map((ct) => (ct === 'null' ? null : ct)),
          orphans: orphans ? true : undefined,
        },
      },
    })
      .then(() => setStage('DONE'))
      .catch((err: Error) => {
        addError(err.message)
        onOpenChange(false)
      })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.queues.enqueue_torrent_processing_batch')}</DialogTitle>
        </DialogHeader>

        {stage === 'PENDING' && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={purge} onCheckedChange={(checked) => setPurge(!!checked)} />
              {t('dashboard.queues.purge_queue_jobs')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!localSearchDisabled}
                onCheckedChange={(checked) => {
                  setLocalSearchDisabled(!checked)
                  if (!checked) setApisDisabled(true)
                }}
              />
              {t('torrents.reprocess.match_content_by_local_search')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={!apisDisabled} onCheckedChange={(checked) => setApisDisabled(!checked)} />
              {t('torrents.reprocess.match_content_by_external_api_search')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={classifierRematch} onCheckedChange={(checked) => setClassifierRematch(!!checked)} />
              {t('torrents.reprocess.force_rematch')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={orphans}
                onCheckedChange={(checked) => {
                  setOrphans(!!checked)
                  if (checked) setContentTypes(['all'])
                }}
              />
              {t('dashboard.queues.process_orphaned_torrents_only')}
            </label>

            <div>
              <h4 className="mb-2 text-sm font-semibold">{t('facets.content_type')}</h4>
              <div className="grid grid-cols-2 gap-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={contentTypes.includes('all')}
                    onCheckedChange={(checked) => checked && setContentTypes(['all'])}
                  />
                  <CircleSlash className="size-4 shrink-0 text-muted-fg" />
                  {t('general.all')}
                </label>
                {contentTypeList.map((ct) => (
                  <label key={ct.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={contentTypes.includes(ct.key)}
                      onCheckedChange={(checked) => toggleContentType(ct.key, !!checked)}
                    />
                    <ct.icon className="size-4 shrink-0 text-muted-fg" />
                    {t(`content_types.plural.${ct.key}`)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        {stage === 'REQUESTING' && <p className="text-sm text-muted-fg">...</p>}
        {stage === 'DONE' && <p className="text-sm">{t('dashboard.queues.jobs_enqueued')}</p>}

        <DialogFooter>
          {stage === 'PENDING' && (
            <Button variant="danger" onClick={handleEnqueue}>
              {t('dashboard.queues.enqueue_jobs')}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
