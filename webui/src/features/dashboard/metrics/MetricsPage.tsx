import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'
import { QueueVisualize } from '../queue/QueueVisualize'
import { TorrentMetrics } from '../torrents/TorrentMetrics'

export function MetricsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('routes.metrics'), t('routes.dashboard'))

  return (
    <Tabs defaultValue="queue">
      <TabsList>
        <TabsTrigger value="queue">{t('dashboard.queues.queue')}</TabsTrigger>
        <TabsTrigger value="torrents">{t('routes.torrent_metrics')}</TabsTrigger>
      </TabsList>
      <TabsContent value="queue">
        <QueueVisualize />
      </TabsContent>
      <TabsContent value="torrents">
        <TorrentMetrics />
      </TabsContent>
    </Tabs>
  )
}
