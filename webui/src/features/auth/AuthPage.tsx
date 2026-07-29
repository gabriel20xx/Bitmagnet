import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Magnet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from './useAuth'

export function AuthPage({ setupRequired }: { setupRequired: boolean }) {
  const { t } = useTranslation()
  const { createInitialUser, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (setupRequired && password !== confirmPassword) {
      setError(t('auth.passwords_do_not_match'))
      return
    }

    setSubmitting(true)
    try {
      if (setupRequired) {
        await createInitialUser({ username, password })
      } else {
        await login({ username, password })
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('auth.request_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-8">
      <section className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Magnet className="size-8 text-primary" />
          <h1 className="text-xl font-semibold">Bitmagnet</h1>
          <p className="text-sm text-muted-fg">
            {t(setupRequired ? 'auth.setup_description' : 'auth.login_description')}
          </p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="auth-username" className="mb-1 block text-sm font-medium">
              {t('auth.username')}
            </label>
            <input
              id="auth-username"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete={setupRequired ? 'username' : 'username'}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-medium">
              {t('auth.password')}
            </label>
            <input
              id="auth-password"
              type="password"
              className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={setupRequired ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
          </div>
          {setupRequired && (
            <div>
              <label htmlFor="auth-confirm-password" className="mb-1 block text-sm font-medium">
                {t('auth.confirm_password')}
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {t(submitting ? 'auth.working' : setupRequired ? 'auth.create_account' : 'auth.sign_in')}
          </Button>
        </form>
      </section>
    </main>
  )
}
