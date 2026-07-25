package gqlmodel

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/archive"
	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/database/search"
	"github.com/bitmagnet-io/bitmagnet/internal/gql/gqlmodel/gen"
	"github.com/bitmagnet-io/bitmagnet/internal/mediastream"
	"github.com/bitmagnet-io/bitmagnet/internal/metrics/torrentmetrics"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
)

type TorrentQuery struct {
	Dao                  *dao.Query
	Search               search.Search
	TorrentMetricsClient torrentmetrics.Client
	MediaStreamService   *mediastream.Service
}

// ArchiveEntries lists the contents of an archive file inside a torrent - unlike every
// other field on this type, this isn't a database read, it's a live computation that
// fetches bytes from BitTorrent peers (see internal/mediastream and internal/archive).
func (t TorrentQuery) ArchiveEntries(ctx context.Context, infoHash protocol.ID, index int) ([]archive.Entry, error) {
	if index < 0 {
		return nil, mediastream.ErrFileNotFound
	}

	torrent, findErr := t.Dao.Torrent.WithContext(ctx).
		Where(t.Dao.Torrent.InfoHash.Eq(infoHash)).
		Preload(t.Dao.Torrent.Files.RelationField, t.Dao.Torrent.Pieces.RelationField).
		First()
	if findErr != nil {
		return nil, findErr
	}

	return t.MediaStreamService.ListArchive(ctx, torrent, uint(index))
}

func (t TorrentQuery) SuggestTags(
	ctx context.Context,
	input *gen.SuggestTagsQueryInput,
) (search.TorrentSuggestTagsResult, error) {
	suggestTagsQuery := search.SuggestTagsQuery{}

	if input != nil {
		if prefix, ok := input.Prefix.ValueOK(); ok && prefix != nil {
			suggestTagsQuery.Prefix = *prefix
		}

		if exclusions, ok := input.Exclusions.ValueOK(); ok {
			suggestTagsQuery.Exclusions = exclusions
		}
	}

	return t.Search.TorrentSuggestTags(ctx, suggestTagsQuery)
}

func (t TorrentQuery) ListSources(ctx context.Context) (gen.TorrentListSourcesResult, error) {
	result, err := t.Dao.TorrentSource.WithContext(ctx).Order(t.Dao.TorrentSource.Key.Asc()).Find()
	if err != nil {
		return gen.TorrentListSourcesResult{}, err
	}

	sources := make([]model.TorrentSource, len(result))
	for i := range result {
		sources[i] = *result[i]
	}

	return gen.TorrentListSourcesResult{
		Sources: sources,
	}, nil
}

type TorrentMutation struct{}
