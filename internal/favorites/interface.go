package favorites

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
)

type Manager interface {
	ListLists(ctx context.Context) ([]model.FavoritesList, error)
	CreateList(ctx context.Context, name string) (model.FavoritesList, error)
	RenameList(ctx context.Context, id string, name string) (model.FavoritesList, error)
	DeleteList(ctx context.Context, id string) error
	// SetFavorite assigns infoHash to listID, replacing any existing assignment.
	SetFavorite(ctx context.Context, infoHash protocol.ID, listID string) error
	// RemoveFavorite un-favorites infoHash, if it's currently favorited.
	RemoveFavorite(ctx context.Context, infoHash protocol.ID) error
}
