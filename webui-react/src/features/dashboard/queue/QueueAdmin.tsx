import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { PurgeJobsDialog } from './PurgeJobsDialog'
import { EnqueueReprocessBatchDialog } from './EnqueueReprocessBatchDialog'

// Port of webui/src/app/dashboard/queue/queue-admin.component.ts/.html

export function QueueAdmin() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.admin'), t('routes.queues'), t('routes.dashboard'))

  const [purgeOpen, setPurgeOpen] = useState(false)
  const [enqueueOpen, setEnqueueOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <ul className="space-y-1">
        <li>
          <Button variant="link" onClick={() => setPurgeOpen(true)}>
            {t('dashboard.queues.purge_queue_jobs')}
          </Button>
        </li>
        <li>
          <Button variant="link" onClick={() => setEnqueueOpen(true)}>
            {t('dashboard.queues.enqueue_torrent_processing_batch')}
          </Button>
        </li>
      </ul>
      <PurgeJobsDialog open={purgeOpen} onOpenChange={setPurgeOpen} />
      <EnqueueReprocessBatchDialog open={enqueueOpen} onOpenChange={setEnqueueOpen} />
    </div>
  )
}
