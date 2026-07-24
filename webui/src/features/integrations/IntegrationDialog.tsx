import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Check, Loader2, PlugZap, X } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { addError } from '@/lib/toast/store'
import {
  CreateIntegrationDocument,
  UpdateIntegrationDocument,
  type IntegrationFragment,
  type IntegrationType,
} from '@/lib/graphql/generated'
import { integrationTypeLabels, integrationTypeList } from './integrationTypes'
import { useTestConnection } from './useTestConnection'

const testStatusIcon = {
  idle: <PlugZap className="size-4" />,
  testing: <Loader2 className="size-4 animate-spin" />,
  success: <Check className="size-4 text-primary" />,
  error: <X className="size-4 text-danger" />,
}

const inputClass =
  'h-9 w-full rounded-md border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

type AuthMethod = 'password' | 'apiKey'

export function IntegrationDialog({
  open,
  onOpenChange,
  integration,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration?: IntegrationFragment | null
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const isEdit = integration != null

  const [type, setType] = useState<IntegrationType>('qbittorrent')
  const [name, setName] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [url, setUrl] = useState('')
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')

  const [create, { loading: creating }] = useMutation(CreateIntegrationDocument)
  const [update, { loading: updating }] = useMutation(UpdateIntegrationDocument)
  const saving = creating || updating
  const { status: testStatus, test, testSaved } = useTestConnection()

  useEffect(() => {
    if (!open) return
    setType(integration?.type ?? 'qbittorrent')
    setName(integration?.name ?? '')
    setEnabled(integration?.enabled ?? true)
    setUrl(integration?.url ?? '')
    setAuthMethod('password')
    setUsername(integration?.username ?? '')
    setPassword('')
    setApiKey('')
  }, [open, integration])

  const canSave = name.trim().length > 0 && url.trim().length > 0
  const canTest = url.trim().length > 0

  const handleTest = () => {
    if (!canTest || testStatus === 'testing') return

    // Blank credential fields mean "keep the existing ones" in edit mode - since those real
    // values never reach the client, test the saved integration's own credentials instead.
    if (isEdit && password.length === 0 && apiKey.length === 0) {
      testSaved(integration.id)
      return
    }

    test({ type, url, username, password, apiKey })
  }

  const handleSave = () => {
    if (!canSave || saving) return

    const mutation = isEdit
      ? update({
          variables: {
            id: integration.id,
            input: {
              name,
              enabled,
              url,
              username,
              password: password.length > 0 ? password : undefined,
              apiKey: apiKey.length > 0 ? apiKey : undefined,
            },
          },
        })
      : create({
          variables: {
            input: { type, name, enabled, url, username, password, apiKey },
          },
        })

    mutation
      .then(() => {
        onOpenChange(false)
        onSaved()
      })
      .catch((err: Error) => addError(err.message))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'integrations.edit_integration' : 'integrations.add_integration')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('integrations.type')}</label>
            <Select value={type} onValueChange={(v) => setType(v as IntegrationType)} disabled={isEdit}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {integrationTypeList.map((key) => (
                  <SelectItem key={key} value={key}>
                    {integrationTypeLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('integrations.name')}</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={integrationTypeLabels[type]}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('integrations.url')}</label>
            <input
              className={inputClass}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:8080"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t('integrations.auth_method')}</label>
            <div className="flex gap-1 rounded-md border border-border p-1">
              {(['password', 'apiKey'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setAuthMethod(method)}
                  className={cn(
                    'flex-1 rounded px-2 py-1 text-sm transition-colors',
                    authMethod === method ? 'bg-surface-hover font-medium text-primary' : 'text-muted-fg',
                  )}
                >
                  {t(method === 'password' ? 'integrations.auth_password' : 'integrations.auth_api_key')}
                </button>
              ))}
            </div>
          </div>

          {authMethod === 'password' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">{t('integrations.username')}</label>
                <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('integrations.password')}</label>
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? t('integrations.password_unchanged') : ''}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('integrations.api_key')}</label>
              <input
                type="password"
                className={inputClass}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isEdit ? t('integrations.password_unchanged') : ''}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={enabled} onCheckedChange={(checked) => setEnabled(!!checked)} />
            {t('integrations.enabled')}
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={!canTest} onClick={handleTest}>
            {testStatusIcon[testStatus]}
            {t('integrations.test_connection')}
          </Button>
          <Button type="button" disabled={!canSave || saving} onClick={handleSave}>
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
