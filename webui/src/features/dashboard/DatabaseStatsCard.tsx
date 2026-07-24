import { useTranslation } from 'react-i18next'
import { Database } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { DatabaseStatsDocument } from '@/lib/graphql/generated'
import { formatFilesize } from '@/lib/utils/filesize'

export function DatabaseStatsCard() {
  const { t, i18n } = useTranslation()
  const { data } = useQuery(DatabaseStatsDocument, { fetchPolicy: 'cache-and-network' })
  const stats = data?.databaseStats

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Database className="size-5" />
        {t('dashboard.database.title')}
      </h3>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted-fg">{t('dashboard.database.entries')}</dt>
          <dd className="text-2xl font-semibold">{stats ? stats.torrentsCount.toLocaleString(i18n.language) : '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-fg">{t('dashboard.database.size')}</dt>
          <dd className="text-2xl font-semibold">{stats ? formatFilesize(stats.sizeBytes, i18n.language) : '—'}</dd>
        </div>
      </dl>
    </div>
  )
}
