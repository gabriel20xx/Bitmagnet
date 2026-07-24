package tmdb

import (
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"github.com/bitmagnet-io/bitmagnet/internal/settings"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Params struct {
	fx.In
	Config          Config
	Logger          *zap.SugaredLogger
	SettingsManager lazy.Lazy[settings.Manager]
}

type Result struct {
	fx.Out
	Client lazy.Lazy[Client]
}

func New(p Params) Result {
	return Result{
		Client: lazy.New(func() (Client, error) {
			rl := &requesterLazy{
				config:          p.Config,
				settingsManager: p.SettingsManager,
				logger:          p.Logger,
			}

			return client{requester: rl, keyInvalidator: rl}, nil
		}),
	}
}
