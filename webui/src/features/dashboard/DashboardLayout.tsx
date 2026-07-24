import { Outlet } from 'react-router'

export function DashboardLayout() {
  return (
    <div className="p-4">
      <Outlet />
    </div>
  )
}
