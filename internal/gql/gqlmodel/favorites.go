package gqlmodel

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/favorites"
	"github.com/bitmagnet-io/bitmagnet/internal/gql/gqlmodel/gen"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
)

type FavoritesMutation struct {
	Manager favorites.Manager
}

func (m FavoritesMutation) CreateList(
	ctx context.Context,
	input gen.CreateFavoritesListInput,
) (model.FavoritesList, error) {
	return m.Manager.CreateList(ctx, input.Name)
}

func (m FavoritesMutation) RenameList(
	ctx context.Context,
	id string,
	input gen.RenameFavoritesListInput,
) (model.FavoritesList, error) {
	return m.Manager.RenameList(ctx, id, input.Name)
}

func (m FavoritesMutation) DeleteList(ctx context.Context, id string) (*string, error) {
	return nil, m.Manager.DeleteList(ctx, id)
}

func (m FavoritesMutation) Set(ctx context.Context, input gen.SetFavoriteInput) (*string, error) {
	return nil, m.Manager.SetFavorite(ctx, input.InfoHash, input.FavoritesListID)
}

func (m FavoritesMutation) Remove(ctx context.Context, infoHash protocol.ID) (*string, error) {
	return nil, m.Manager.RemoveFavorite(ctx, infoHash)
}
