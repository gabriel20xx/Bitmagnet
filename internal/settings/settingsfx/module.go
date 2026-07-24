package settingsfx

import (
	"github.com/bitmagnet-io/bitmagnet/internal/settings"
	"go.uber.org/fx"
)

func New() fx.Option {
	return fx.Module(
		"settings",
		fx.Provide(
			settings.New,
		),
	)
}
