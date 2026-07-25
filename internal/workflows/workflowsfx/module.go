package workflowsfx

import (
	"github.com/bitmagnet-io/bitmagnet/internal/workflows"
	workflowsqueue "github.com/bitmagnet-io/bitmagnet/internal/workflows/queue"
	"go.uber.org/fx"
)

func New() fx.Option {
	return fx.Module(
		"workflows",
		fx.Provide(
			workflows.New,
			workflowsqueue.New,
		),
	)
}
