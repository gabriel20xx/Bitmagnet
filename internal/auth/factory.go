package auth

import (
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"go.uber.org/fx"
	"gorm.io/gorm"
)

type Params struct {
	fx.In
	DB     lazy.Lazy[*gorm.DB]
	Config Config
}

func New(p Params) Service {
	return &service{db: p.DB, config: p.Config}
}
