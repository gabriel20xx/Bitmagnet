package gqlmodel

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
)

type DatabaseStatsQuery struct {
	Dao *dao.Query
}

func (q DatabaseStatsQuery) TorrentsCount(ctx context.Context) (int, error) {
	count, err := q.Dao.Torrent.WithContext(ctx).Count()
	if err != nil {
		return 0, err
	}

	return int(count), nil
}

// SizeBytes is the Postgres database's total on-disk size, including indexes.
func (q DatabaseStatsQuery) SizeBytes(ctx context.Context) (int, error) {
	var sizeBytes int64

	err := q.Dao.UnderlyingDB().WithContext(ctx).Raw("SELECT pg_database_size(current_database())").Row().Scan(&sizeBytes)
	if err != nil {
		return 0, err
	}

	return int(sizeBytes), nil
}
