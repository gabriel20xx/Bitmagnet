package search

import (
	"github.com/bitmagnet-io/bitmagnet/internal/database/query"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

const TorrentFavoritesListFacetKey = "torrent_favorites_list"

func TorrentFavoritesListFacet(options ...query.FacetOption) query.Facet {
	return torrentFavoritesListFacet{
		FacetConfig: query.NewFacetConfig(
			append([]query.FacetOption{
				query.FacetHasKey(TorrentFavoritesListFacetKey),
				query.FacetHasLabel("Favorites List"),
				query.FacetUsesAndLogic(),
				query.FacetHasAggregationOption(query.RequireJoin(model.TableNameTorrentContent)),
				query.FacetTriggersCte(),
			}, options...)...,
		),
	}
}

type torrentFavoritesListFacet struct {
	query.FacetConfig
}

func (torrentFavoritesListFacet) Values(ctx query.FacetContext) (map[string]string, error) {
	var lists []model.FavoritesList

	if err := ctx.Query().UnderlyingDB().WithContext(ctx.Context()).Order("name").Find(&lists).Error; err != nil {
		return nil, err
	}

	values := make(map[string]string, len(lists))
	for _, list := range lists {
		values[list.ID] = list.Name
	}

	return values, nil
}

func (torrentFavoritesListFacet) Criteria(filter query.FacetFilter) []query.Criteria {
	criteria := make([]query.Criteria, len(filter))
	for i, id := range filter.Values() {
		criteria[i] = TorrentFavoritesListCriteria(id)
	}

	return criteria
}
