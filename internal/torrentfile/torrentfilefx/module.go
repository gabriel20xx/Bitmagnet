package torrentfilefx

import (
	"github.com/bitmagnet-io/bitmagnet/internal/torrentfile/httpserver"
	"go.uber.org/fx"
)

func New() fx.Option {
	return fx.Module(
		"torrentfile",
		fx.Provide(
			httpserver.New,
		),
	)
}
