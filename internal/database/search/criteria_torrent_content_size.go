package search

import (
	"github.com/bitmagnet-io/bitmagnet/internal/database/query"
	"github.com/bitmagnet-io/bitmagnet/internal/maps"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gen/field"
)

func TorrentContentSizeCriteria(minSize, maxSize *uint) query.Criteria {
	if minSize == nil && maxSize == nil {
		return query.DBCriteria{SQL: "TRUE"}
	}

	return query.DaoCriteria{
		Conditions: func(ctx query.DBContext) ([]field.Expr, error) {
			q := ctx.Query()
			var conds []field.Expr
			if minSize != nil {
				conds = append(conds, q.Torrent.Size.Gte(*minSize))
			}
			if maxSize != nil {
				conds = append(conds, q.Torrent.Size.Lte(*maxSize))
			}
			return conds, nil
		},
		Joins: maps.NewInsertMap(
			maps.MapEntry[string, struct{}]{Key: model.TableNameTorrent},
		),
	}
}
