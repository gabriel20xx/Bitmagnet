import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { PurgeJobsDialog } from './PurgeJobsDialog'
import { EnqueueReprocessBatchDialog } from './EnqueueReprocessBatchDialog'
import { SetTmdbApiKeyDialog } from './SetTmdbApiKeyDialog'

// Port of webui/src/app/dashboard/queue/queue-admin.component.ts/.html

export function QueueAdmin() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.admin'), t('routes.dashboard'))

  const [purgeOpen, setPurgeOpen] = useState(false)
  const [enqueueOpen, setEnqueueOpen] = useState(false)
  const [tmdbApiKeyOpen, setTmdbApiKeyOpen] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <ul className="space-y-4">
        <li>
          <Button variant="link" className="h-auto p-0" onClick={() => setPurgeOpen(true)}>
            {t('dashboard.queues.purge_queue_jobs')}
          </Button>
          <p className="mt-1 text-sm text-muted-fg">{t('dashboard.queues.purge_queue_jobs_description')}</p>
        </li>
        <li>
          <Button variant="link" className="h-auto p-0" onClick={() => setEnqueueOpen(true)}>
            {t('dashboard.queues.enqueue_torrent_processing_batch')}
          </Button>
          <p className="mt-1 text-sm text-muted-fg">
            {t('dashboard.queues.enqueue_torrent_processing_batch_description')}
          </p>
        </li>
        <li>
          <Button variant="link" className="h-auto p-0" onClick={() => setTmdbApiKeyOpen(true)}>
            {t('dashboard.queues.set_tmdb_api_key')}
          </Button>
          <p className="mt-1 text-sm text-muted-fg">{t('dashboard.queues.set_tmdb_api_key_description')}</p>
        </li>
      </ul>
      <PurgeJobsDialog open={purgeOpen} onOpenChange={setPurgeOpen} />
      <EnqueueReprocessBatchDialog open={enqueueOpen} onOpenChange={setEnqueueOpen} />
      <SetTmdbApiKeyDialog open={tmdbApiKeyOpen} onOpenChange={setTmdbApiKeyOpen} />
    </div>
  )
}
