package settings

import (
	"context"
	"errors"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type manager struct {
	db *gorm.DB
}

func (m manager) Get(ctx context.Context, key string) (string, bool, error) {
	var kv model.KeyValue

	err := m.db.WithContext(ctx).Where("key = ?", key).First(&kv).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return "", false, nil
	}

	if err != nil {
		return "", false, err
	}

	return kv.Value, true, nil
}

func (m manager) Set(ctx context.Context, key, value string) error {
	kv := model.KeyValue{Key: key, Value: value}

	return m.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "key"}},
			DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
		}).
		Create(&kv).Error
}

func (m manager) Delete(ctx context.Context, key string) error {
	return m.db.WithContext(ctx).Where("key = ?", key).Delete(&model.KeyValue{}).Error
}
