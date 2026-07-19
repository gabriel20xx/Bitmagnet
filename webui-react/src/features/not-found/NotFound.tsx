import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useDocumentTitle } from '@/lib/hooks/useDocumentTitle'

export function NotFound() {
  const { t } = useTranslation()
  useDocumentTitle(t('general.page_not_found'))

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-4xl font-bold">{t('general.page_not_found')}</h1>
      <Link to="/torrents" className="text-primary underline">
        {t('routes.torrents')}
      </Link>
    </div>
  )
}
