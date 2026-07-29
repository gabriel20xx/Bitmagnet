import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from './useAuth'

export function CredentialsDialog({
  open,
  onOpenChange,
  currentUsername,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUsername: string
}) {
  const { t } = useTranslation()
  const { updateCredentials } = useAuth()
  const [username, setUsername] = useState(currentUsername)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwords_do_not_match'))
      return
    }

    setSaving(true)
    try {
      await updateCredentials({
        currentPassword,
        username: username.trim() || undefined,
        newPassword: newPassword || undefined,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onOpenChange(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('auth.request_failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('auth.change_credentials')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="credentials-username" className="mb-1 block text-sm font-medium">
              {t('auth.username')}
            </label>
            <input
              id="credentials-username"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="credentials-current-password" className="mb-1 block text-sm font-medium">
              {t('auth.current_password')}
            </label>
            <input
              id="credentials-current-password"
              type="password"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label htmlFor="credentials-new-password" className="mb-1 block text-sm font-medium">
              {t('auth.new_password')}
            </label>
            <input
              id="credentials-new-password"
              type="password"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder={t('auth.leave_blank_to_keep')}
            />
          </div>
          <div>
            <label htmlFor="credentials-confirm-password" className="mb-1 block text-sm font-medium">
              {t('auth.confirm_password')}
            </label>
            <input
              id="credentials-confirm-password"
              type="password"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('general.dismiss')}
            </Button>
            <Button type="submit" disabled={saving}>
              {t(saving ? 'auth.working' : 'general.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
