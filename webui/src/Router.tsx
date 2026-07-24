import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { RootLayout } from '@/features/layout/RootLayout'
import { DashboardLayout } from '@/features/dashboard/DashboardLayout'
import { DashboardHome } from '@/features/dashboard/DashboardHome'
import { QueueVisualize } from '@/features/dashboard/queue/QueueVisualize'
import { QueueJobs } from '@/features/dashboard/queue/QueueJobs'
import { QueueAdmin } from '@/features/dashboard/queue/QueueAdmin'
import { TorrentMetrics } from '@/features/dashboard/torrents/TorrentMetrics'
import { IntegrationsPage } from '@/features/integrations/IntegrationsPage'
import { TorrentsSearch } from '@/features/torrents/TorrentsSearch'
import { TorrentPermalink } from '@/features/torrents/TorrentPermalink'
import { NotFound } from '@/features/not-found/NotFound'

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <Navigate to="/torrents" replace /> },
        {
          path: 'torrents',
          children: [
            { index: true, element: <TorrentsSearch /> },
            { path: 'permalink/:infoHash', element: <TorrentPermalink /> },
          ],
        },
        {
          path: 'dashboard',
          element: <DashboardLayout />,
          children: [
            { index: true, element: <DashboardHome /> },
            { path: 'visualize', element: <QueueVisualize /> },
            { path: 'jobs', element: <QueueJobs /> },
            { path: 'admin', element: <QueueAdmin /> },
            { path: 'torrents', element: <TorrentMetrics /> },
            { path: 'integrations', element: <IntegrationsPage /> },
          ],
        },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  { basename: '/webui' },
)

export function Router() {
  return <RouterProvider router={router} />
}
