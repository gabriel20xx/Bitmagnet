package search

import (
	"github.com/bitmagnet-io/bitmagnet/internal/database/query"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
	"gorm.io/gen/field"
)

// TorrentContentNotDuplicateCriteria restricts results to canonical torrent_content rows, i.e.
// those that aren't recorded as a duplicate of another torrent. This is the default for search,
// so near-identical re-uploads/repacks are collapsed out of results.
func TorrentContentNotDuplicateCriteria() query.Criteria {
	return query.DaoCriteria{
		Conditions: func(ctx query.DBContext) ([]field.Expr, error) {
			q := ctx.Query()

			return []field.Expr{q.TorrentContent.DuplicateOfInfoHash.IsNull()}, nil
		},
	}
}

// TorrentContentDuplicateOfCriteria restricts results to torrent_content rows recorded as a
// duplicate of the given info hash, i.e. the members of a duplicate group collapsed out of the
// default search results by TorrentContentNotDuplicateCriteria.
func TorrentContentDuplicateOfCriteria(infoHash protocol.ID) query.Criteria {
	return query.DaoCriteria{
		Conditions: func(ctx query.DBContext) ([]field.Expr, error) {
			q := ctx.Query()

			return []field.Expr{q.TorrentContent.DuplicateOfInfoHash.Eq(infoHash.Bytes())}, nil
		},
	}
}
