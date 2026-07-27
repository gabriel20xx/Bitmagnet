package diagnostics

import (
	"context"
	"strings"

	"gorm.io/gorm"
)

const (
	slowQueriesLimit    = 20
	tableScanStatsLimit = 20
)

const pgStatStatementsUnavailableReason = "The pg_stat_statements extension is not installed on this Postgres " +
	"server. Enable it by adding pg_stat_statements to shared_preload_libraries in postgresql.conf, " +
	"restarting Postgres, then running: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

// pgStatStatementsNotLoadedReason covers the case where CREATE EXTENSION already succeeded but
// shared_preload_libraries wasn't (or is no longer) set, so the view exists but querying it fails.
const pgStatStatementsNotLoadedReason = "The pg_stat_statements extension is installed but not active - " +
	"it also needs to be added to shared_preload_libraries in postgresql.conf, with Postgres restarted " +
	"afterwards."

type client struct {
	db *gorm.DB
}

func (c client) SlowQueries(ctx context.Context) (SlowQueriesResult, error) {
	var installed bool
	if err := c.db.WithContext(ctx).
		Raw("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')").
		Row().Scan(&installed); err != nil {
		return SlowQueriesResult{}, err
	}

	if !installed {
		reason := pgStatStatementsUnavailableReason

		return SlowQueriesResult{Available: false, UnavailableReason: &reason}, nil
	}

	var queries []SlowQuery
	err := c.db.WithContext(ctx).Raw(`
		SELECT
			substring(query for 300) AS query,
			calls,
			round(total_exec_time::numeric, 1) AS total_exec_ms,
			round(mean_exec_time::numeric, 1) AS mean_exec_ms,
			rows,
			round((100 * total_exec_time / greatest(sum(total_exec_time) OVER (), 1))::numeric, 1) AS pct_of_total
		FROM pg_stat_statements
		WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
		ORDER BY total_exec_time DESC
		LIMIT ?
	`, slowQueriesLimit).Scan(&queries).Error
	if err != nil {
		if isStatStatementsNotLoadedError(err) {
			reason := pgStatStatementsNotLoadedReason

			return SlowQueriesResult{Available: false, UnavailableReason: &reason}, nil
		}

		return SlowQueriesResult{}, err
	}

	return SlowQueriesResult{Available: true, Queries: queries}, nil
}

// isStatStatementsNotLoadedError detects Postgres's own error for this exact situation ("pg_stat_statements
// must be loaded via shared_preload_libraries"), rather than treating it as an unexpected failure.
func isStatStatementsNotLoadedError(err error) bool {
	return strings.Contains(err.Error(), "pg_stat_statements must be loaded")
}

func (c client) TableScanStats(ctx context.Context) (TableScanStatsResult, error) {
	var rows []rawTableScanStat

	err := c.db.WithContext(ctx).Raw(`
		SELECT
			relname AS table_name,
			seq_scan,
			seq_tup_read,
			COALESCE(idx_scan, 0) AS idx_scan,
			n_live_tup AS live_rows
		FROM pg_stat_user_tables
		WHERE seq_scan > 0
		ORDER BY seq_tup_read DESC
		LIMIT ?
	`, tableScanStatsLimit).Scan(&rows).Error
	if err != nil {
		return TableScanStatsResult{}, err
	}

	tables := make([]TableScanStat, len(rows))
	for i, r := range rows {
		tables[i] = r.stat()
	}

	return TableScanStatsResult{Tables: tables}, nil
}

type rawTableScanStat struct {
	TableName  string
	SeqScan    uint
	SeqTupRead uint
	IdxScan    uint
	LiveRows   uint
}

func (r rawTableScanStat) stat() TableScanStat {
	var ratio float64
	if total := r.SeqScan + r.IdxScan; total > 0 {
		ratio = float64(r.SeqScan) / float64(total)
	}

	return TableScanStat{
		TableName:    r.TableName,
		SeqScan:      r.SeqScan,
		SeqTupRead:   r.SeqTupRead,
		IdxScan:      r.IdxScan,
		LiveRows:     r.LiveRows,
		SeqScanRatio: ratio,
	}
}
