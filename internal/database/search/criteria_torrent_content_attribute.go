package search

import (
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

			vals := make([]interface{}, len(values))
			for i, v := range values {
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
