// Package diagnostics surfaces Postgres query-performance signals - slow query shapes (from the
// optional pg_stat_statements extension) and tables read mostly via sequential scans (from the
// always-available pg_stat_user_tables view) - to help identify which indexes are worth adding.
package diagnostics

import "context"

type SlowQuery struct {
	Query       string
	Calls       uint
	TotalExecMs float64
	MeanExecMs  float64
	Rows        uint
	PctOfTotal  float64
}

type SlowQueriesResult struct {
	// Available is false when the pg_stat_statements extension isn't installed/active, in
	// which case Queries is always empty and UnavailableReason explains why.
	Available         bool
	UnavailableReason *string
	Queries           []SlowQuery
}

type TableScanStat struct {
	TableName string
	SeqScan   uint
	// SeqTupRead is the total number of rows read via sequential scans - a large value
	// relative to LiveRows indicates the table is being repeatedly scanned in full.
	SeqTupRead uint
	IdxScan    uint
	LiveRows   uint
	// SeqScanRatio is SeqScan / (SeqScan + IdxScan): how often a scan of this table went
	// sequential rather than through an index, from 0 (always indexed) to 1 (never indexed).
	SeqScanRatio float64
}

type TableScanStatsResult struct {
	Tables []TableScanStat
}

type Client interface {
	SlowQueries(ctx context.Context) (SlowQueriesResult, error)
	TableScanStats(ctx context.Context) (TableScanStatsResult, error)
}
