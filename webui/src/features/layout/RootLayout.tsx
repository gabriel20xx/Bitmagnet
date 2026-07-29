import { Outlet } from 'react-router'
import { AuthPage } from '@/features/auth/AuthPage'
import { useAuth } from '@/features/auth/useAuth'
import { Header } from './Header'

export function RootLayout() {
  const { status, loading, error } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-fg">Loading…</div>
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center px-4 text-sm text-danger">{error.message}</div>
  }

  if (!status || status.setupRequired || !status.authenticated) {
    return <AuthPage setupRequired={status?.setupRequired ?? true} />
  }

  return (
    <div className="flex min-h-screen flex-col min-[960px]:flex-row">
      <Header />
      <main className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
