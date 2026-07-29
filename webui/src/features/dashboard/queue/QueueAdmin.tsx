import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { useLiveTorrentSearch } from '@/lib/preferences/searchPreferences'
import { PurgeJobsDialog } from './PurgeJobsDialog'
import { EnqueueReprocessBatchDialog } from './EnqueueReprocessBatchDialog'
import { SetTmdbApiKeyDialog } from './SetTmdbApiKeyDialog'
import { DbDiagnosticsSection } from './DbDiagnosticsSection'
import { TechStackSection } from './TechStackSection'

// Port of webui/src/app/dashboard/queue/queue-admin.component.ts/.html

export function QueueAdmin() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.settings'), t('routes.dashboard'))

  const [purgeOpen, setPurgeOpen] = useState(false)
  const [enqueueOpen, setEnqueueOpen] = useState(false)
  const [tmdbApiKeyOpen, setTmdbApiKeyOpen] = useState(false)
  const [liveSearchEnabled, setLiveSearchEnabled] = useLiveTorrentSearch()
  const liveSearchCheckboxId = useId()

  return (
    <div className="p-4">
      <div className="grid items-start gap-4 lg:grid-cols-2">
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
            <li>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={liveSearchCheckboxId}
                  checked={liveSearchEnabled}
                  onCheckedChange={(checked) => setLiveSearchEnabled(checked === true)}
                />
                <label htmlFor={liveSearchCheckboxId} className="cursor-pointer text-sm font-medium">
                  {t('dashboard.queues.live_torrent_search')}
                </label>
              </div>
              <p className="mt-1 text-sm text-muted-fg">{t('dashboard.queues.live_torrent_search_description')}</p>
            </li>
          </ul>
          <PurgeJobsDialog open={purgeOpen} onOpenChange={setPurgeOpen} />
          <EnqueueReprocessBatchDialog open={enqueueOpen} onOpenChange={setEnqueueOpen} />
          <SetTmdbApiKeyDialog open={tmdbApiKeyOpen} onOpenChange={setTmdbApiKeyOpen} />
        </div>
        <TechStackSection />
      </div>
      <DbDiagnosticsSection />
    </div>
  )
}
