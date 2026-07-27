package gqlmodel

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/database/diagnostics"
)

type DbDiagnosticsQuery struct {
	Client diagnostics.Client
}

func (q DbDiagnosticsQuery) SlowQueries(ctx context.Context) (diagnostics.SlowQueriesResult, error) {
	return q.Client.SlowQueries(ctx)
}

func (q DbDiagnosticsQuery) TableScanStats(ctx context.Context) (diagnostics.TableScanStatsResult, error) {
	return q.Client.TableScanStats(ctx)
}
