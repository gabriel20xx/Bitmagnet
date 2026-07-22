import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { formatTimeAgo } from '@/lib/dates/format'
import type { QueueJobFragment } from '@/lib/graphql/generated'
import type { JobsTableColumn } from './queueConstants'

// Port of webui/src/app/dashboard/queue/queue-jobs-table.component.ts/.html

function beautifyPayload(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}

export function QueueJobsTable({
  items,
  loading,
  displayedColumns,
  expandedId,
  onToggleExpanded,
}: {
  items: QueueJobFragment[]
  loading: boolean
  displayedColumns: readonly JobsTableColumn[]
  expandedId: string | null
  onToggleExpanded: (id: string) => void
}) {
  const { t, i18n } = useTranslation()

  const copy = (value: string) => void navigator.clipboard.writeText(value)

  return (
    <div>
      {loading && <div className="h-0.5 w-full animate-pulse bg-primary" />}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted-fg">
            {displayedColumns.includes('id') && <th className="py-2 pl-3 font-medium">ID</th>}
            {displayedColumns.includes('queue') && <th className="py-2 font-medium">{t('dashboard.queues.queue')}</th>}
            {displayedColumns.includes('priority') && (
              <th className="py-2 font-medium">{t('dashboard.queues.priority')}</th>
            )}
            {displayedColumns.includes('status') && <th className="py-2 font-medium">{t('general.status')}</th>}
            {displayedColumns.includes('error') && <th className="py-2 font-medium">{t('general.error')}</th>}
            {displayedColumns.includes('createdAt') && (
              <th className="py-2 text-center font-medium">{t('dashboard.queues.created_at')}</th>
            )}
            {displayedColumns.includes('ranAt') && (
              <th className="py-2 text-center font-medium">{t('dashboard.queues.ran_at')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const expanded = expandedId === item.id
            return (
              <Fragment key={item.id}>
                <tr
                  onClick={() => onToggleExpanded(item.id)}
                  className={
                    'cursor-pointer border-t border-border hover:bg-surface-hover ' +
                    (expanded ? 'bg-surface-hover' : '')
                  }
                >
                  {displayedColumns.includes('id') && (
                    <td className="max-w-40 truncate py-2 pl-3 font-mono text-xs">{item.id}</td>
                  )}
                  {displayedColumns.includes('queue') && <td className="py-2">{item.queue}</td>}
                  {displayedColumns.includes('priority') && (
                    <td className="py-2">{item.priority.toLocaleString(i18n.language)}</td>
                  )}
                  {displayedColumns.includes('status') && <td className="py-2">{item.status}</td>}
                  {displayedColumns.includes('error') && (
                    <td className="max-w-52 truncate py-2 text-danger">
                      {item.error ? item.error.slice(0, 20) + '...' : ''}
                    </td>
                  )}
                  {displayedColumns.includes('createdAt') && (
                    <td className="py-2 text-center">{formatTimeAgo(item.createdAt, i18n.language)}</td>
                  )}
                  {displayedColumns.includes('ranAt') && (
                    <td className="py-2 text-center">{item.ranAt ? formatTimeAgo(item.ranAt, i18n.language) : ''}</td>
                  )}
                </tr>
                {expanded && (
                  <tr className="border-t border-border bg-surface/50">
                    <td colSpan={displayedColumns.length} className="p-4">
                      <p className="mb-2 text-sm">
                        <strong>ID:</strong>{' '}
                        <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
                          <span className="cursor-copy underline decoration-dotted" onClick={() => copy(item.id)}>
                            {item.id}
                          </span>
                        </SimpleTooltip>
                      </p>
                      <h5 className="mb-1 text-sm font-semibold">
                        <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
                          <span className="cursor-copy underline decoration-dotted" onClick={() => copy(item.payload)}>
                            {t('dashboard.queues.payload')}:
                          </span>
                        </SimpleTooltip>
                      </h5>
                      <pre className="max-h-52 overflow-auto rounded bg-surface-hover p-2 text-xs">
                        {beautifyPayload(item.payload)}
                      </pre>
                      {item.error && (
                        <>
                          <h5 className="mb-1 mt-2 text-sm font-semibold">
                            <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
                              <span
                                className="cursor-copy underline decoration-dotted"
                                onClick={() => copy(item.error ?? '')}
                              >
                                {t('general.error')}:
                              </span>
                            </SimpleTooltip>
                          </h5>
                          <pre className="max-h-52 overflow-auto rounded bg-surface-hover p-2 text-xs text-danger">
                            {item.error}
                          </pre>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
