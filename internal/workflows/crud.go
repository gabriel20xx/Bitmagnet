package workflows

import (
	"context"
	"errors"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("workflow not found")

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
	workflow := model.Workflow{
		Name:           req.Name,
		Enabled:        req.Enabled,
		IntegrationID:  req.IntegrationID,
		MatchOnRematch: req.MatchOnRematch,
		Criteria:       req.Criteria,
	}

	err := m.db.WithContext(ctx).Create(&workflow).Error

	return workflow, err
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

	if req.IntegrationID != nil {
		workflow.IntegrationID = *req.IntegrationID
	}

	if req.MatchOnRematch != nil {
		workflow.MatchOnRematch = *req.MatchOnRematch
	}

	if req.Criteria != nil {
		workflow.Criteria = *req.Criteria
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
