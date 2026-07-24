import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@apollo/client/react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { addError } from '@/lib/toast/store'
import { ClearTmdbApiKeyDocument, SetTmdbApiKeyDocument, TmdbSettingsDocument } from '@/lib/graphql/generated'

const inputClass =
  'h-9 w-full rounded-md border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function SetTmdbApiKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { data, refetch } = useQuery(TmdbSettingsDocument, { skip: !open, fetchPolicy: 'network-only' })
  const [apiKey, setApiKey] = useState('')
  const [setApiKeyMutation, { loading: saving }] = useMutation(SetTmdbApiKeyDocument)
  const [clearApiKeyMutation, { loading: clearing }] = useMutation(ClearTmdbApiKeyDocument)

  useEffect(() => {
    if (open) setApiKey('')
  }, [open])

  const hasCustomKey = data?.tmdb.hasCustomApiKey ?? false

  const handleSave = () => {
    if (apiKey.trim().length === 0) return

    setApiKeyMutation({ variables: { apiKey: apiKey.trim() } })
      .then(() => onOpenChange(false))
      .catch((err: Error) => addError(err.message))
  }

  const handleClear = () => {
    clearApiKeyMutation()
      .then(() => refetch())
      .catch((err: Error) => addError(err.message))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.queues.set_tmdb_api_key')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-fg">
            {hasCustomKey ? t('dashboard.queues.tmdb_api_key_custom') : t('dashboard.queues.tmdb_api_key_default')}
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('integrations.api_key')}</label>
            <input
              type="password"
              className={inputClass}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('dashboard.queues.tmdb_api_key_placeholder')}
            />
          </div>
        </div>

        <DialogFooter>
          {hasCustomKey && (
            <Button type="button" variant="outline" disabled={clearing} onClick={handleClear}>
              {t('dashboard.queues.tmdb_api_key_reset')}
            </Button>
          )}
          <Button type="button" disabled={apiKey.trim().length === 0 || saving} onClick={handleSave}>
            {t('general.save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
