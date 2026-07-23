package search

import (
	"database/sql/driver"
	"fmt"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/database/query"
	"github.com/bitmagnet-io/bitmagnet/internal/maps"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gen/field"
	"gorm.io/gorm/clause"
)

type torrentContentAttributeFacet[T attribute] struct {
	query.FacetConfig
	field func(*dao.Query) field.Expr
	parse func(string) (T, error)
}

type attribute interface {
	fmt.Stringer
	driver.Valuer
	Label() string
}

func (torrentContentAttributeFacet[T]) Values(query.FacetContext) (map[string]string, error) {
	return map[string]string{}, nil
}

func (f torrentContentAttributeFacet[T]) Criteria(filter query.FacetFilter) []query.Criteria {
	if len(filter) == 0 {
		return []query.Criteria{}
	}

	return []query.Criteria{
		query.GenCriteria(func(ctx query.DBContext) (query.Criteria, error) {
			fld := f.field(ctx.Query())
			values := make([]driver.Valuer, 0, len(filter))
			hasNull := false
			for _, v := range filter.Values() {
				if v == "null" {
					hasNull = true
					continue
				}
				parsed, parseErr := f.parse(v)
				if parseErr != nil {
					return nil, parseErr
				}
				values = append(values, parsed)
			}
			var or []query.Criteria
			joins := maps.NewInsertMap(maps.MapEntry[string, struct{}]{Key: model.TableNameTorrentContent})
			if len(values) > 0 {
				vals := make([]interface{}, len(values))
				for i, v := range values {
					vals[i] = v
				}

				or = append(or, query.RawCriteria{
					Query: clause.IN{Column: fld.RawExpr(), Values: vals},
					Joins: joins,
				})
			}
			if hasNull {
				or = append(or, query.RawCriteria{
					Query: clause.Expr{SQL: "? IS NULL", Vars: []interface{}{fld.RawExpr()}},
					Joins: joins,
				})
			}
			return query.Or(or...), nil
		}),
	}
}
