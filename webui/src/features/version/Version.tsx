import { useQuery } from '@apollo/client/react'
import { useTranslation } from 'react-i18next'
import { VersionDocument } from '@/lib/graphql/generated'
import { SimpleTooltip } from '@/components/ui/tooltip'

const defaultVersionName = 'v-unknown'

export function Version() {
  const { t } = useTranslation()
  const { data, error } = useQuery(VersionDocument)

  const version = !error && data?.version ? data.version : undefined

  return (
    <SimpleTooltip label={t('version.bitmagnet_version', { version: version ?? t('version.unknown') })}>
      <span className="text-xs text-muted-fg">{version ?? defaultVersionName}</span>
    </SimpleTooltip>
  )
}
