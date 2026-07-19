import { Outlet } from 'react-router'
import { Header } from './Header'

export function RootLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
