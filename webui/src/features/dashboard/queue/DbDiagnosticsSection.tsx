import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client/react'
import { DbDiagnosticsDocument } from '@/lib/graphql/generated'

// A sequential-scan ratio above this is highlighted as a likely-missing-index candidate.
const HIGH_SEQ_SCAN_RATIO = 0.5

export function DbDiagnosticsSection() {
  const { t, i18n } = useTranslation()
  const { data, loading, error } = useQuery(DbDiagnosticsDocument, { fetchPolicy: 'cache-and-network' })

  const slowQueries = data?.dbDiagnostics.slowQueries
  const tableScanStats = data?.dbDiagnostics.tableScanStats

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-1 text-sm font-medium">{t('dashboard.queues.db_diagnostics')}</h3>
      <p className="mb-3 text-sm text-muted-fg">{t('dashboard.queues.db_diagnostics_description')}</p>

      {loading && !data && <p className="text-sm text-muted-fg">{t('dashboard.queues.db_diagnostics_loading')}</p>}
      {error && <p className="text-sm text-danger">{error.message}</p>}

      {slowQueries && (
        <div className="mb-6">
          <h4 className="mb-2 text-xs font-medium uppercase text-muted-fg">{t('dashboard.queues.slow_queries')}</h4>
          {!slowQueries.available ? (
            <p className="rounded-md border border-border bg-bg p-3 text-sm text-muted-fg">
              {slowQueries.unavailableReason}
            </p>
          ) : slowQueries.queries.length === 0 ? (
            <p className="text-sm text-muted-fg">{t('general.none')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-fg">
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.query')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.calls')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.total_ms')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.mean_ms')}</th>
                    <th className="py-1.5 font-medium">{t('dashboard.queues.pct_of_total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {slowQueries.queries.map((q, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="max-w-xl truncate py-1.5 pr-2 font-mono text-xs" title={q.query}>
                        {q.query}
                      </td>
                      <td className="py-1.5 pr-2">{q.calls.toLocaleString(i18n.language)}</td>
                      <td className="py-1.5 pr-2">{q.totalExecMs.toLocaleString(i18n.language)}</td>
                      <td className="py-1.5 pr-2">{q.meanExecMs.toLocaleString(i18n.language)}</td>
                      <td className="py-1.5">{q.pctOfTotal.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tableScanStats && (
        <div>
          <h4 className="mb-1 text-xs font-medium uppercase text-muted-fg">{t('dashboard.queues.table_scan_stats')}</h4>
          <p className="mb-2 text-sm text-muted-fg">{t('dashboard.queues.table_scan_stats_description')}</p>
          {tableScanStats.tables.length === 0 ? (
            <p className="text-sm text-muted-fg">{t('general.none')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-fg">
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.table')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.seq_scan')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.seq_tup_read')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.idx_scan')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('dashboard.queues.live_rows')}</th>
                    <th className="py-1.5 font-medium">{t('dashboard.queues.seq_scan_ratio')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableScanStats.tables.map((tb) => (
                    <tr key={tb.tableName} className="border-t border-border">
                      <td className="py-1.5 pr-2 font-mono text-xs">{tb.tableName}</td>
                      <td className="py-1.5 pr-2">{tb.seqScan.toLocaleString(i18n.language)}</td>
                      <td className="py-1.5 pr-2">{tb.seqTupRead.toLocaleString(i18n.language)}</td>
                      <td className="py-1.5 pr-2">{tb.idxScan.toLocaleString(i18n.language)}</td>
                      <td className="py-1.5 pr-2">{tb.liveRows.toLocaleString(i18n.language)}</td>
                      <td className="py-1.5">
                        <span className={tb.seqScanRatio > HIGH_SEQ_SCAN_RATIO ? 'font-medium text-danger' : undefined}>
                          {(tb.seqScanRatio * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
