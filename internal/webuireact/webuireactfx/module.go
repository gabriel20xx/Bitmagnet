package webuireactfx

import (
	"github.com/bitmagnet-io/bitmagnet/internal/config/configfx"
	"github.com/bitmagnet-io/bitmagnet/internal/webuireact"
	"go.uber.org/fx"
)

func New() fx.Option {
	return fx.Module(
		"webui_react_server",
		configfx.NewConfigModule[webuireact.Config]("webui_react_server", webuireact.NewDefaultConfig()),
		fx.Provide(
			webuireact.New,
		),
	)
}
