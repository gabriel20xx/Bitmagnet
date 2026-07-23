package mediastreamfx

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/config/configfx"
	"github.com/bitmagnet-io/bitmagnet/internal/mediastream"
	"github.com/bitmagnet-io/bitmagnet/internal/mediastream/httpserver"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

func New() fx.Option {
	return fx.Module(
		"mediastream",
		configfx.NewConfigModule[mediastream.Config]("media_stream", mediastream.NewDefaultConfig()),
		fx.Provide(newService),
		fx.Provide(httpserver.New),
	)
}

type serviceParams struct {
	fx.In
	Config    mediastream.Config
	Logger    *zap.SugaredLogger
	Lifecycle fx.Lifecycle
}

func newService(p serviceParams) (*mediastream.Service, error) {
	s, err := mediastream.New(p.Config, p.Logger)
	if err != nil {
		return nil, err
	}

	p.Lifecycle.Append(fx.Hook{
		OnStop: func(_ context.Context) error {
			return s.Close()
		},
	})

	return s, nil
}
