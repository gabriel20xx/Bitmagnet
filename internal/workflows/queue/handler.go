package queue

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/database/query"
	"github.com/bitmagnet-io/bitmagnet/internal/database/search"
	"github.com/bitmagnet-io/bitmagnet/internal/favorites"
	"github.com/bitmagnet-io/bitmagnet/internal/integrations"
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/queue/handler"
	"github.com/bitmagnet-io/bitmagnet/internal/workflows"
	"go.uber.org/fx"
	"gorm.io/gorm/clause"
)

type Params struct {
	fx.In
	Dao                 lazy.Lazy[*dao.Query]
	Search              lazy.Lazy[search.Search]
	WorkflowManager     lazy.Lazy[workflows.Manager]
	IntegrationsManager lazy.Lazy[integrations.Manager]
	FavoritesManager    lazy.Lazy[favorites.Manager]
}

type Result struct {
	fx.Out
	Handler lazy.Lazy[handler.Handler] `group:"queue_handlers"`
}

func New(p Params) Result {
	return Result{
		Handler: lazy.New(func() (handler.Handler, error) {
			d, err := p.Dao.Get()
			if err != nil {
				return handler.Handler{}, err
			}

			s, err := p.Search.Get()
			if err != nil {
				return handler.Handler{}, err
			}

			wm, err := p.WorkflowManager.Get()
			if err != nil {
				return handler.Handler{}, err
			}

			im, err := p.IntegrationsManager.Get()
			if err != nil {
				return handler.Handler{}, err
			}

			fm, err := p.FavoritesManager.Get()
			if err != nil {
				return handler.Handler{}, err
			}

			return handler.New(
				workflows.ApplyToExistingMessageName,
				func(ctx context.Context, job model.QueueJob) error {
					msg := &workflows.ApplyToExistingMessageParams{}
					if err := json.Unmarshal([]byte(job.Payload), msg); err != nil {
						return err
					}

					wf, wfErr := wm.Get(ctx, msg.WorkflowID)
					if errors.Is(wfErr, workflows.ErrNotFound) {
						// the workflow was deleted since this scan started - stop.
						return nil
					}

					if wfErr != nil {
						return wfErr
					}

					if !wf.Enabled {
						return nil
					}

					result, searchErr := s.TorrentContent(
						ctx,
						search.TorrentContentDefaultOption(),
						query.Limit(workflows.ApplyToExistingPageSize),
						query.Offset(msg.Page*workflows.ApplyToExistingPageSize),
					)
					if searchErr != nil {
						return searchErr
					}

					var magnetURIs []string

					for _, item := range result.Items {
						if !wf.Criteria.Matches(item.Torrent, item.TorrentContent) {
							continue
						}

						if wf.IntegrationID != nil {
							magnetURIs = append(magnetURIs, item.Torrent.MagnetURI())
						}

						if wf.FavoritesListID != nil {
							if favErr := fm.SetFavorite(ctx, item.Torrent.InfoHash, *wf.FavoritesListID); favErr != nil {
								return favErr
							}
						}
					}

					if len(magnetURIs) > 0 && wf.IntegrationID != nil {
						if sendErr := im.Send(ctx, *wf.IntegrationID, magnetURIs); sendErr != nil {
							return sendErr
						}
					}

					if len(result.Items) < workflows.ApplyToExistingPageSize {
						return nil
					}

					nextJob, jobErr := workflows.NewApplyToExistingQueueJob(workflows.ApplyToExistingMessageParams{
						WorkflowID: msg.WorkflowID,
						Page:       msg.Page + 1,
					})
					if jobErr != nil {
						return jobErr
					}

					return d.QueueJob.WithContext(ctx).Clauses(clause.OnConflict{
						DoNothing: true,
					}).Create(&nextJob)
				},
				handler.JobTimeout(time.Minute*5),
				handler.Concurrency(1),
			), nil
		}),
	}
}
