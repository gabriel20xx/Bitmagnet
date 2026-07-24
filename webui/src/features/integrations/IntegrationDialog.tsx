import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addError } from '@/lib/toast/store'
import {
  CreateIntegrationDocument,
  UpdateIntegrationDocument,
  type IntegrationFragment,
  type IntegrationType,
} from '@/lib/graphql/generated'
import { integrationTypeLabels, integrationTypeList } from './integrationTypes'

const inputClass =
  'h-9 w-full rounded-md border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [create, { loading: creating }] = useMutation(CreateIntegrationDocument)
  const [update, { loading: updating }] = useMutation(UpdateIntegrationDocument)
  const saving = creating || updating

  useEffect(() => {
    if (!open) return
    setType(integration?.type ?? 'qbittorrent')
    setName(integration?.name ?? '')
    setEnabled(integration?.enabled ?? true)
    setUrl(integration?.url ?? '')
    setUsername(integration?.username ?? '')
    setPassword('')
  }, [open, integration])

  const canSave = name.trim().length > 0 && url.trim().length > 0

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
            },
          },
        })
      : create({
          variables: {
            input: { type, name, enabled, url, username, password },
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

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={enabled} onCheckedChange={(checked) => setEnabled(!!checked)} />
            {t('integrations.enabled')}
          </label>
        </div>

        <DialogFooter>
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
