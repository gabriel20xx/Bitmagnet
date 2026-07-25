package gqlmodel

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/gql/gqlmodel/gen"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/workflows"
)

type WorkflowsMutation struct {
	Manager workflows.Manager
}

func (m WorkflowsMutation) Create(ctx context.Context, input gen.CreateWorkflowInput) (model.Workflow, error) {
	req := workflows.CreateRequest{
		Name:            input.Name,
		Enabled:         true,
		IntegrationID:   input.IntegrationID.Value(),
		FavoritesListID: input.FavoritesListID.Value(),
		Criteria:        input.Criteria,
	}

	if enabled, ok := input.Enabled.ValueOK(); ok && enabled != nil {
		req.Enabled = *enabled
	}

	if matchOnRematch, ok := input.MatchOnRematch.ValueOK(); ok && matchOnRematch != nil {
		req.MatchOnRematch = *matchOnRematch
	}

	return m.Manager.Create(ctx, req)
}

func (m WorkflowsMutation) Update(
	ctx context.Context,
	id string,
	input gen.UpdateWorkflowInput,
) (model.Workflow, error) {
	req := workflows.UpdateRequest{}

	if name, ok := input.Name.ValueOK(); ok {
		req.Name = name
	}

	if enabled, ok := input.Enabled.ValueOK(); ok {
		req.Enabled = enabled
	}

	// Unlike the other fields, IntegrationID/FavoritesListID are always applied (see the comment
	// on workflows.manager.Update) rather than gated on ValueOK, since nil is itself meaningful
	// here (clear that action) and WorkflowDialog always submits the full current form state.
	req.IntegrationID = input.IntegrationID.Value()
	req.FavoritesListID = input.FavoritesListID.Value()

	if matchOnRematch, ok := input.MatchOnRematch.ValueOK(); ok {
		req.MatchOnRematch = matchOnRematch
	}

	if criteria, ok := input.Criteria.ValueOK(); ok {
		req.Criteria = criteria
	}

	return m.Manager.Update(ctx, id, req)
}

func (m WorkflowsMutation) Delete(ctx context.Context, id string) (*string, error) {
	return nil, m.Manager.Delete(ctx, id)
}

func (m WorkflowsMutation) ApplyToExisting(ctx context.Context, id string) (*string, error) {
	return nil, m.Manager.ApplyToExisting(ctx, id)
}
