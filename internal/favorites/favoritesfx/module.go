package favoritesfx

import (
	"github.com/bitmagnet-io/bitmagnet/internal/favorites"
	"go.uber.org/fx"
)

func New() fx.Option {
	return fx.Module(
		"favorites",
		fx.Provide(
			favorites.New,
		),
	)
}
