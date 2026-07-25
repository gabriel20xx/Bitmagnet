import { Outlet } from 'react-router'
import { Header } from './Header'

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}
