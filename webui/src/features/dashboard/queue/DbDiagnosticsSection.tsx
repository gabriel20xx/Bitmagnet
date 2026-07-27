import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client/react'
import { ArrowDown, ArrowUp, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopyFeedback } from '@/lib/hooks/useCopyFeedback'
import { DbDiagnosticsDocument, type DbDiagnosticsQuery } from '@/lib/graphql/generated'

// A sequential-scan ratio above this is highlighted as a likely-missing-index candidate.
const HIGH_SEQ_SCAN_RATIO = 0.5

type SlowQueryRow = DbDiagnosticsQuery['dbDiagnostics']['slowQueries']['queries'][number]
type TableScanRow = DbDiagnosticsQuery['dbDiagnostics']['tableScanStats']['tables'][number]

type SortDirection = 'asc' | 'desc'

function useSortableRows<T>(rows: T[], initialKey: keyof T, initialDirection: SortDirection) {
  const [sortKey, setSortKey] = useState<keyof T>(initialKey)
  const [direction, setDirection] = useState<SortDirection>(initialDirection)

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return direction === 'asc' ? cmp : -cmp
    })
    return copy
  }, [rows, sortKey, direction])

  const toggleSort = (key: keyof T, defaultDirection: SortDirection) => {
    if (key === sortKey) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setDirection(defaultDirection)
    }
  }

  return { sorted, sortKey, direction, toggleSort }
}

function SortableHeaderCell<T>({
  label,
  columnKey,
  defaultDirection,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string
  columnKey: keyof T
  defaultDirection: SortDirection
  activeKey: keyof T
  direction: SortDirection
  onSort: (key: keyof T, defaultDirection: SortDirection) => void
  className?: string
}) {
  const active = columnKey === activeKey

  return (
    <th className={className ?? 'py-1.5 pr-2 font-medium'}>
      <button
        type="button"
        onClick={() => onSort(columnKey, defaultDirection)}
        className="flex items-center gap-1 hover:text-fg"
      >
        {label}
        {active && (direction === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </button>
    </th>
  )
}

// Escapes markdown table syntax and collapses newlines so a query/table name can't break the
// table layout when pasted somewhere that renders markdown (e.g. an AI chat).
function mdCell(value: string | number): string {
  return String(value).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')
}

function buildMarkdownExport(
  slowQueries: DbDiagnosticsQuery['dbDiagnostics']['slowQueries'] | undefined,
  tableScanStats: DbDiagnosticsQuery['dbDiagnostics']['tableScanStats'] | undefined,
): string {
  const lines: string[] = ['# Postgres query diagnostics (bitmagnet)', '']

  if (slowQueries) {
    lines.push('## Slow queries (top by cumulative execution time)')
    if (!slowQueries.available) {
      lines.push(slowQueries.unavailableReason ?? 'pg_stat_statements is not available.')
    } else if (slowQueries.queries.length === 0) {
      lines.push('No slow queries recorded.')
    } else {
      lines.push('| Query | Calls | Total ms | Mean ms | Rows | % of total |')
      lines.push('|---|---|---|---|---|---|')
      for (const q of slowQueries.queries) {
        lines.push(
          `| ${mdCell(q.query)} | ${q.calls} | ${q.totalExecMs} | ${q.meanExecMs} | ${q.rows} | ${q.pctOfTotal}% |`,
        )
      }
    }
    lines.push('')
  }

  if (tableScanStats) {
    lines.push('## Table scan stats (sequential vs index scans)')
    if (tableScanStats.tables.length === 0) {
      lines.push('No tables with sequential scans recorded.')
    } else {
      lines.push('| Table | Seq scans | Rows read (seq) | Index scans | Live rows | Seq scan ratio |')
      lines.push('|---|---|---|---|---|---|')
      for (const tb of tableScanStats.tables) {
        lines.push(
          `| ${mdCell(tb.tableName)} | ${tb.seqScan} | ${tb.seqTupRead} | ${tb.idxScan} | ${tb.liveRows} | ${(
            tb.seqScanRatio * 100
          ).toFixed(0)}% |`,
        )
      }
    }
  }

  return lines.join('\n')
}

function SlowQueriesTable({ queries }: { queries: SlowQueryRow[] }) {
  const { t, i18n } = useTranslation()
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<SlowQueryRow>(queries, 'totalExecMs', 'desc')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase text-muted-fg">
            <SortableHeaderCell
              label={t('dashboard.queues.query')}
              columnKey="query"
              defaultDirection="asc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.calls')}
              columnKey="calls"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.total_ms')}
              columnKey="totalExecMs"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.mean_ms')}
              columnKey="meanExecMs"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.pct_of_total')}
              columnKey="pctOfTotal"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
              className="py-1.5 font-medium"
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((q, i) => (
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
  )
}

function TableScanStatsTable({ tables }: { tables: TableScanRow[] }) {
  const { t, i18n } = useTranslation()
  const { sorted, sortKey, direction, toggleSort } = useSortableRows<TableScanRow>(tables, 'seqTupRead', 'desc')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase text-muted-fg">
            <SortableHeaderCell
              label={t('dashboard.queues.table')}
              columnKey="tableName"
              defaultDirection="asc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.seq_scan')}
              columnKey="seqScan"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.seq_tup_read')}
              columnKey="seqTupRead"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.idx_scan')}
              columnKey="idxScan"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.live_rows')}
              columnKey="liveRows"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
            />
            <SortableHeaderCell
              label={t('dashboard.queues.seq_scan_ratio')}
              columnKey="seqScanRatio"
              defaultDirection="desc"
              activeKey={sortKey}
              direction={direction}
              onSort={toggleSort}
              className="py-1.5 font-medium"
            />
          </tr>
        </thead>
        <tbody>
          {sorted.map((tb) => (
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
  )
}

export function DbDiagnosticsSection() {
  const { t } = useTranslation()
  const { data, loading, error } = useQuery(DbDiagnosticsDocument, { fetchPolicy: 'cache-and-network' })
  const [copied, copy] = useCopyFeedback()

  const slowQueries = data?.dbDiagnostics.slowQueries
  const tableScanStats = data?.dbDiagnostics.tableScanStats

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium">{t('dashboard.queues.db_diagnostics')}</h3>
        {data && (
          <Button variant="secondary" size="sm" onClick={() => copy(buildMarkdownExport(slowQueries, tableScanStats))}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t(copied ? 'torrents.copied' : 'dashboard.queues.export_for_ai')}
          </Button>
        )}
      </div>
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
            <SlowQueriesTable queries={slowQueries.queries} />
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
            <TableScanStatsTable tables={tableScanStats.tables} />
          )}
        </div>
      )}
    </div>
  )
}
