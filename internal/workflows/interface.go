package workflows

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

type CreateRequest struct {
	Name            string
	Enabled         bool
	IntegrationID   *string
	FavoritesListID *string
	MatchOnRematch  bool
	Criteria        model.WorkflowCriteria
}

type UpdateRequest struct {
	Name            *string
	Enabled         *bool
	IntegrationID   *string
	FavoritesListID *string
	MatchOnRematch  *bool
	Criteria        *model.WorkflowCriteria
}

type Manager interface {
	List(ctx context.Context) ([]model.Workflow, error)
	// ListEnabled returns enabled workflows, for evaluating against newly classified torrents.
	ListEnabled(ctx context.Context) ([]model.Workflow, error)
	Get(ctx context.Context, id string) (model.Workflow, error)
	Create(ctx context.Context, req CreateRequest) (model.Workflow, error)
	Update(ctx context.Context, id string, req UpdateRequest) (model.Workflow, error)
	Delete(ctx context.Context, id string) error
	// ApplyToExisting enqueues a background scan of already-classified torrents against the
	// workflow's criteria, sending every match to its integration.
	ApplyToExisting(ctx context.Context, id string) error
}
