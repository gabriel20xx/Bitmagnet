package gqlfx

import (
	"github.com/99designs/gqlgen/graphql"
	"github.com/bitmagnet-io/bitmagnet/internal/blocking"
	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/database/diagnostics"
	"github.com/bitmagnet-io/bitmagnet/internal/database/search"
	"github.com/bitmagnet-io/bitmagnet/internal/favorites"
	"github.com/bitmagnet-io/bitmagnet/internal/gql"
	"github.com/bitmagnet-io/bitmagnet/internal/gql/config"
	"github.com/bitmagnet-io/bitmagnet/internal/gql/httpserver"
	"github.com/bitmagnet-io/bitmagnet/internal/gql/resolvers"
	"github.com/bitmagnet-io/bitmagnet/internal/health"
	"github.com/bitmagnet-io/bitmagnet/internal/integrations"
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"github.com/bitmagnet-io/bitmagnet/internal/mediastream"
	"github.com/bitmagnet-io/bitmagnet/internal/metrics/queuemetrics"
	"github.com/bitmagnet-io/bitmagnet/internal/metrics/torrentmetrics"
	"github.com/bitmagnet-io/bitmagnet/internal/processor"
	"github.com/bitmagnet-io/bitmagnet/internal/queue/manager"
	"github.com/bitmagnet-io/bitmagnet/internal/settings"
	"github.com/bitmagnet-io/bitmagnet/internal/tmdb"
	"github.com/bitmagnet-io/bitmagnet/internal/worker"
	"github.com/bitmagnet-io/bitmagnet/internal/workflows"
	"go.uber.org/fx"
)

func New() fx.Option {
	return fx.Module(
		"graphql",
		fx.Provide(
			config.New,
			httpserver.New,
			func(
				lcfg lazy.Lazy[gql.Config],
			) lazy.Lazy[graphql.ExecutableSchema] {
				return lazy.New(func() (graphql.ExecutableSchema, error) {
					cfg, err := lcfg.Get()
					if err != nil {
						return nil, err
					}

					return gql.NewExecutableSchema(cfg), nil
				})
			},
		),
		fx.Provide(
			func(p Params) Result {
				return Result{
					Resolver: lazy.New(func() (*resolvers.Resolver, error) {
						ch, err := p.Checker.Get()
						if err != nil {
							return nil, err
						}
						s, err := p.Search.Get()
						if err != nil {
							return nil, err
						}
						d, err := p.Dao.Get()
						if err != nil {
							return nil, err
						}
						qmc, err := p.QueueMetricsClient.Get()
						if err != nil {
							return nil, err
						}
						qm, err := p.QueueManager.Get()
						if err != nil {
							return nil, err
						}
						tm, err := p.TorrentMetricsClient.Get()
						if err != nil {
							return nil, err
						}
						pr, err := p.Processor.Get()
						if err != nil {
							return nil, err
						}
						bm, err := p.BlockingManager.Get()
						if err != nil {
							return nil, err
						}
						im, err := p.IntegrationsManager.Get()
						if err != nil {
							return nil, err
						}
						wfm, err := p.WorkflowManager.Get()
						if err != nil {
							return nil, err
						}
						fm, err := p.FavoritesManager.Get()
						if err != nil {
							return nil, err
						}
						sm, err := p.SettingsManager.Get()
						if err != nil {
							return nil, err
						}
						tc, err := p.TmdbClient.Get()
						if err != nil {
							return nil, err
						}
						dc, err := p.DiagnosticsClient.Get()
						if err != nil {
							return nil, err
						}
						return &resolvers.Resolver{
							Dao:                  d,
							Search:               s,
							Checker:              ch,
							QueueMetricsClient:   qmc,
							QueueManager:         qm,
							TorrentMetricsClient: tm,
							Processor:            pr,
							BlockingManager:      bm,
							IntegrationsManager:  im,
							WorkflowManager:      wfm,
							FavoritesManager:     fm,
							SettingsManager:      sm,
							TmdbClient:           tc,
							MediaStreamService:   p.MediaStreamService,
							DiagnosticsClient:    dc,
						}, nil
					}),
				}
			},
		),
		// inject resolver dependencies avoiding a circular dependency:
		fx.Invoke(func(
			resolver lazy.Lazy[*resolvers.Resolver],
			workers worker.Registry,
		) {
			resolver.Decorate(func(r *resolvers.Resolver) (*resolvers.Resolver, error) {
				r.Workers = workers
				return r, nil
			})
		}),
	)
}

type Params struct {
	fx.In
	Search               lazy.Lazy[search.Search]
	Dao                  lazy.Lazy[*dao.Query]
	Checker              lazy.Lazy[health.Checker]
	QueueMetricsClient   lazy.Lazy[queuemetrics.Client]
	QueueManager         lazy.Lazy[manager.Manager]
	TorrentMetricsClient lazy.Lazy[torrentmetrics.Client]
	Processor            lazy.Lazy[processor.Processor]
	BlockingManager      lazy.Lazy[blocking.Manager]
	IntegrationsManager  lazy.Lazy[integrations.Manager]
	WorkflowManager      lazy.Lazy[workflows.Manager]
	FavoritesManager     lazy.Lazy[favorites.Manager]
	SettingsManager      lazy.Lazy[settings.Manager]
	TmdbClient           lazy.Lazy[tmdb.Client]
	DiagnosticsClient    lazy.Lazy[diagnostics.Client]
	// MediaStreamService is injected directly (unlike every other field above) since
	// mediastreamfx provides *mediastream.Service eagerly rather than as a lazy.Lazy, and
	// there's no circular dependency here requiring the deferred-resolution trick the other
	// fields use.
	MediaStreamService *mediastream.Service
}

type Result struct {
	fx.Out
	Resolver lazy.Lazy[*resolvers.Resolver]
}
