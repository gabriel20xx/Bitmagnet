package settings

import (
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"go.uber.org/fx"
	"gorm.io/gorm"
)

type Params struct {
	fx.In
	DB lazy.Lazy[*gorm.DB]
}

type Result struct {
	fx.Out
	Manager lazy.Lazy[Manager]
}

func New(params Params) Result {
	return Result{
		Manager: lazy.New[Manager](func() (Manager, error) {
			db, err := params.DB.Get()
			if err != nil {
				return nil, err
			}

			return manager{db: db}, nil
		}),
	}
}
