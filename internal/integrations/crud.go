package integrations

import (
	"context"
	"errors"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("integration not found")

func (m manager) List(ctx context.Context) ([]model.Integration, error) {
	var items []model.Integration

	err := m.db.WithContext(ctx).Order("name").Find(&items).Error

	return items, err
}

func (m manager) Create(ctx context.Context, req CreateRequest) (model.Integration, error) {
	integration := model.Integration{
		Type:     req.Type,
		Name:     req.Name,
		Enabled:  req.Enabled,
		URL:      req.URL,
		Username: model.NewNullString(req.Username),
		Password: model.NewNullString(req.Password),
		APIKey:   model.NewNullString(req.APIKey),
	}

	if err := m.db.WithContext(ctx).Create(&integration).Error; err != nil {
		return model.Integration{}, err
	}

	// GORM substitutes a field's `default` tag value whenever the Go value is that field's zero
	// value - Enabled:false is indistinguishable from "not set" to it, so an explicit false gets
	// silently replaced with the column's default (true). Patch it in separately: an explicit
	// single-column Update isn't subject to that substitution.
	if !req.Enabled {
		if err := m.db.WithContext(ctx).Model(&integration).Update("enabled", false).Error; err != nil {
			return model.Integration{}, err
		}

		integration.Enabled = false
	}

	return integration, nil
}

func (m manager) Update(ctx context.Context, id string, req UpdateRequest) (model.Integration, error) {
	integration, findErr := m.find(ctx, id)
	if findErr != nil {
		return model.Integration{}, findErr
	}

	if req.Name != nil {
		integration.Name = *req.Name
	}

	if req.Enabled != nil {
		integration.Enabled = *req.Enabled
	}

	if req.URL != nil {
		integration.URL = *req.URL
	}

	if req.Username != nil {
		integration.Username = model.NewNullString(*req.Username)
	}

	if req.Password != nil {
		integration.Password = model.NewNullString(*req.Password)
	}

	if req.APIKey != nil {
		integration.APIKey = model.NewNullString(*req.APIKey)
	}

	if err := m.db.WithContext(ctx).Save(&integration).Error; err != nil {
		return model.Integration{}, err
	}

	return integration, nil
}

func (m manager) Delete(ctx context.Context, id string) error {
	res := m.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Integration{})
	if res.Error != nil {
		return res.Error
	}

	if res.RowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (m manager) find(ctx context.Context, id string) (model.Integration, error) {
	var integration model.Integration

	err := m.db.WithContext(ctx).Where("id = ?", id).First(&integration).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Integration{}, ErrNotFound
	}

	return integration, err
}
