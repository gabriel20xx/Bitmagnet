package workflows

import (
	"context"
	"errors"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gorm"
)

var (
	ErrNotFound = errors.New("workflow not found")
	ErrNoAction = errors.New("a workflow needs an integration, a favorites list, or both")
)

func (m manager) List(ctx context.Context) ([]model.Workflow, error) {
	var items []model.Workflow

	err := m.db.WithContext(ctx).Order("name").Find(&items).Error

	return items, err
}

func (m manager) ListEnabled(ctx context.Context) ([]model.Workflow, error) {
	var items []model.Workflow

	err := m.db.WithContext(ctx).Where("enabled = ?", true).Order("name").Find(&items).Error

	return items, err
}

func (m manager) Create(ctx context.Context, req CreateRequest) (model.Workflow, error) {
	if req.IntegrationID == nil && req.FavoritesListID == nil {
		return model.Workflow{}, ErrNoAction
	}

	workflow := model.Workflow{
		Name:            req.Name,
		Enabled:         req.Enabled,
		IntegrationID:   req.IntegrationID,
		FavoritesListID: req.FavoritesListID,
		MatchOnRematch:  req.MatchOnRematch,
		Criteria:        req.Criteria,
	}

	if err := m.db.WithContext(ctx).Create(&workflow).Error; err != nil {
		return model.Workflow{}, err
	}

	// GORM substitutes a field's `default` tag value whenever the Go value is that field's zero
	// value - Enabled:false is indistinguishable from "not set" to it, so an explicit false gets
	// silently replaced with the column's default (true). Patch it in separately: an explicit
	// single-column Update isn't subject to that substitution.
	if !req.Enabled {
		if err := m.db.WithContext(ctx).Model(&workflow).Update("enabled", false).Error; err != nil {
			return model.Workflow{}, err
		}

		workflow.Enabled = false
	}

	return workflow, nil
}

func (m manager) Update(ctx context.Context, id string, req UpdateRequest) (model.Workflow, error) {
	workflow, findErr := m.find(ctx, id)
	if findErr != nil {
		return model.Workflow{}, findErr
	}

	if req.Name != nil {
		workflow.Name = *req.Name
	}

	if req.Enabled != nil {
		workflow.Enabled = *req.Enabled
	}

	// Unlike the other fields, IntegrationID/FavoritesListID are always applied verbatim rather
	// than only when non-nil: nil is itself a meaningful value here (clear that action), and the
	// only caller (the GraphQL resolver) always submits both from the full current form state,
	// so there's no "leave untouched" case to distinguish from "clear it".
	workflow.IntegrationID = req.IntegrationID
	workflow.FavoritesListID = req.FavoritesListID

	if req.MatchOnRematch != nil {
		workflow.MatchOnRematch = *req.MatchOnRematch
	}

	if req.Criteria != nil {
		workflow.Criteria = *req.Criteria
	}

	if workflow.IntegrationID == nil && workflow.FavoritesListID == nil {
		return model.Workflow{}, ErrNoAction
	}

	if err := m.db.WithContext(ctx).Save(&workflow).Error; err != nil {
		return model.Workflow{}, err
	}

	return workflow, nil
}

func (m manager) Get(ctx context.Context, id string) (model.Workflow, error) {
	return m.find(ctx, id)
}

func (m manager) Delete(ctx context.Context, id string) error {
	res := m.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Workflow{})
	if res.Error != nil {
		return res.Error
	}

	if res.RowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (m manager) find(ctx context.Context, id string) (model.Workflow, error) {
	var workflow model.Workflow

	err := m.db.WithContext(ctx).Where("id = ?", id).First(&workflow).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Workflow{}, ErrNotFound
	}

	return workflow, err
}
