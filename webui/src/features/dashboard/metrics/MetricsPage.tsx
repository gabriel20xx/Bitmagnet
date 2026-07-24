import { useTranslation } from 'react-i18next'
import { Activity, Boxes } from 'lucide-react'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { QueueVisualize } from '../queue/QueueVisualize'
import { TorrentMetrics } from '../torrents/TorrentMetrics'

export function MetricsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.metrics'), t('routes.dashboard'))

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Boxes className="size-5" />
          {t('dashboard.queues.queue')}
        </h3>
        <QueueVisualize />
      </section>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Activity className="size-5" />
          {t('routes.torrent_metrics')}
        </h3>
        <TorrentMetrics />
      </section>
    </div>
  )
}
