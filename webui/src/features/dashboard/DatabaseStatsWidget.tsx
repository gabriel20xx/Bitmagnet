import { useTranslation } from 'react-i18next'
import { Database, HardDrive } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { DatabaseStatsDocument } from '@/lib/graphql/generated'
import { formatFilesize } from '@/lib/utils/filesize'
import { SimpleTooltip } from '@/components/ui/tooltip'

export function DatabaseStatsWidget() {
  const { t, i18n } = useTranslation()
  const { data } = useQuery(DatabaseStatsDocument, { fetchPolicy: 'cache-and-network' })
  const stats = data?.databaseStats

  return (
    <div className="hidden items-center gap-3 text-sm text-muted-fg md:flex">
      <SimpleTooltip label={t('dashboard.database.entries')}>
        <span className="flex items-center gap-1.5">
          <Database className="size-4" />
          {stats ? stats.torrentsCount.toLocaleString(i18n.language) : '—'}
        </span>
      </SimpleTooltip>
      <SimpleTooltip label={t('dashboard.database.size')}>
        <span className="flex items-center gap-1.5">
          <HardDrive className="size-4" />
          {stats ? formatFilesize(stats.sizeBytes, i18n.language) : '—'}
        </span>
      </SimpleTooltip>
    </div>
  )
}
