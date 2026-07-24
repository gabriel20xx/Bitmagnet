package integrationsfx

import (
	"github.com/bitmagnet-io/bitmagnet/internal/integrations"
	"go.uber.org/fx"
)

func New() fx.Option {
	return fx.Module(
		"integrations",
		fx.Provide(
			integrations.New,
		),
	)
}
