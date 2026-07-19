import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { QueuePurgeJobsDocument, type QueueJobStatus } from '@/lib/graphql/generated'
import { availableQueueNames, statusNames } from './queueConstants'

// Port of webui/src/app/dashboard/queue/queue-purge-jobs-dialog.component.ts/.html

/**
 * Toggles `value` in/out of `current`, collapsing to `undefined` ("all") whenever every
 * available option ends up selected — mirrors handleQueueEvent/handleStatusEvent in the Angular
 * dialog.
 */
function toggleSelection<T>(
  current: T[] | undefined,
  value: T,
  checked: boolean,
  allValues: readonly T[],
): T[] | undefined {
  if (checked) {
    let next = current ?? []
    if (!next.includes(value)) next = [...next, value]
    return next.length === allValues.length ? undefined : next
  }
  const next = current?.filter((v) => v !== value)
  return next?.length ? next : undefined
}

type Stage = 'PENDING' | 'REQUESTING' | 'DONE'

export function PurgeJobsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const [queues, setQueues] = useState<string[] | undefined>(undefined)
  const [statuses, setStatuses] = useState<QueueJobStatus[] | undefined>(undefined)
  const [stage, setStage] = useState<Stage>('PENDING')
  const [error, setError] = useState<Error>()
  const [purgeJobs] = useMutation(QueuePurgeJobsDocument)

  const reset = () => {
    setQueues(undefined)
    setStatuses(undefined)
    setStage('PENDING')
    setError(undefined)
  }

  const handlePurge = () => {
    if (stage !== 'PENDING') return
    setStage('REQUESTING')
    purgeJobs({ variables: { input: { queues, statuses } } })
      .then(() => setStage('DONE'))
      .catch((err: Error) => {
        setStage('DONE')
        setError(err)
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
          <DialogTitle>{t('dashboard.queues.purge_queue_jobs')}</DialogTitle>
        </DialogHeader>

        {stage === 'PENDING' && (
          <div className="space-y-4">
            <section>
              <h4 className="mb-2 text-sm font-semibold">{t('dashboard.queues.queues')}:</h4>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={queues === undefined} onCheckedChange={() => setQueues(undefined)} />
                  {t('general.all')}
                </label>
                {availableQueueNames.map((queue) => (
                  <label key={queue} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={queues?.includes(queue) ?? false}
                      onCheckedChange={(checked) =>
                        setQueues(toggleSelection(queues, queue, !!checked, availableQueueNames))
                      }
                    />
                    {queue}
                  </label>
                ))}
              </div>
            </section>
            <section>
              <h4 className="mb-2 text-sm font-semibold">{t('general.status')}:</h4>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={statuses === undefined} onCheckedChange={() => setStatuses(undefined)} />
                  {t('general.all')}
                </label>
                {statusNames.map((status) => (
                  <label key={status} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={statuses?.includes(status) ?? false}
                      onCheckedChange={(checked) =>
                        setStatuses(toggleSelection(statuses, status, !!checked, statusNames))
                      }
                    />
                    {t(`dashboard.queues.${status}`)}
                  </label>
                ))}
              </div>
            </section>
          </div>
        )}
        {stage === 'REQUESTING' && <p className="text-sm text-muted-fg">...</p>}
        {stage === 'DONE' && (
          <p className="text-sm">
            {error ? `${t('general.error')}: ${error.message}` : t('dashboard.queues.queue_purged')}
          </p>
        )}

        <DialogFooter>
          <Button variant="danger" disabled={stage !== 'PENDING'} onClick={handlePurge}>
            {t('dashboard.queues.purge_jobs')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
