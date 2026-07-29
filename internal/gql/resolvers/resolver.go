package resolvers

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/bitmagnet-io/bitmagnet/internal/auth"
	"github.com/bitmagnet-io/bitmagnet/internal/blocking"
	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/database/diagnostics"
	"github.com/bitmagnet-io/bitmagnet/internal/database/search"
	"github.com/bitmagnet-io/bitmagnet/internal/favorites"
	"github.com/bitmagnet-io/bitmagnet/internal/health"
	"github.com/bitmagnet-io/bitmagnet/internal/integrations"
	"github.com/bitmagnet-io/bitmagnet/internal/mediastream"
	"github.com/bitmagnet-io/bitmagnet/internal/metrics/queuemetrics"
	"github.com/bitmagnet-io/bitmagnet/internal/metrics/torrentmetrics"
	"github.com/bitmagnet-io/bitmagnet/internal/processor"
	"github.com/bitmagnet-io/bitmagnet/internal/queue/manager"
	"github.com/bitmagnet-io/bitmagnet/internal/settings"
	"github.com/bitmagnet-io/bitmagnet/internal/tmdb"
	"github.com/bitmagnet-io/bitmagnet/internal/worker"
	"github.com/bitmagnet-io/bitmagnet/internal/workflows"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	AuthService          auth.Service
	Dao                  *dao.Query
	Search               search.Search
	Workers              worker.Registry
	Checker              health.Checker
	QueueMetricsClient   queuemetrics.Client
	QueueManager         manager.Manager
	TorrentMetricsClient torrentmetrics.Client
	Processor            processor.Processor
	BlockingManager      blocking.Manager
	IntegrationsManager  integrations.Manager
	WorkflowManager      workflows.Manager
	FavoritesManager     favorites.Manager
	SettingsManager      settings.Manager
	TmdbClient           tmdb.Client
	MediaStreamService   *mediastream.Service
	DiagnosticsClient    diagnostics.Client
}

func (r *Resolver) Authenticated(ctx context.Context, _ any, next graphql.Resolver) (any, error) {
	user, err := r.AuthService.CurrentUser(ctx)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, auth.ErrUnauthorized
	}
	return next(ctx)
}
