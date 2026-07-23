package search

import (
	"database/sql/driver"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/database/query"
	"github.com/bitmagnet-io/bitmagnet/internal/maps"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gen/field"
	"gorm.io/gorm/clause"
)

var VideoResolutionCriteria = torrentContentAttributeCriteria[model.VideoResolution](videoResolutionField)

var Video3DCriteria = torrentContentAttributeCriteria[model.Video3D](video3dField)

func torrentContentAttributeCriteria[T attribute](getFld func(*dao.Query) field.Expr) func(...T) query.Criteria {
	return func(values ...T) query.Criteria {
		return query.GenCriteria(func(ctx query.DBContext) (query.Criteria, error) {
			fld := getFld(ctx.Query())
			valuers := make([]driver.Valuer, 0, len(values))
			for _, v := range values {
				valuers = append(valuers, v)
			}

			vals := make([]interface{}, len(valuers))
			for i, v := range valuers {
				vals[i] = v
			}

			return query.RawCriteria{
				Query: clause.IN{Column: fld.RawExpr(), Values: vals},
				Joins: maps.NewInsertMap(
					maps.MapEntry[string, struct{}]{Key: model.TableNameTorrentContent},
				),
			}, nil
		})
	}
}
