package favorites

import (
	"context"
	"errors"
	"strings"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrNotFound    = errors.New("favorites list not found")
	ErrNameInvalid = errors.New("favorites list name must not be empty")
)

func (m manager) ListLists(ctx context.Context) ([]model.FavoritesList, error) {
	var items []model.FavoritesList

	err := m.db.WithContext(ctx).Order("name").Find(&items).Error

	return items, err
}

func (m manager) CreateList(ctx context.Context, name string) (model.FavoritesList, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return model.FavoritesList{}, ErrNameInvalid
	}

	list := model.FavoritesList{Name: name}

	err := m.db.WithContext(ctx).Create(&list).Error

	return list, err
}

func (m manager) RenameList(ctx context.Context, id string, name string) (model.FavoritesList, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return model.FavoritesList{}, ErrNameInvalid
	}

	list, findErr := m.findList(ctx, id)
	if findErr != nil {
		return model.FavoritesList{}, findErr
	}

	list.Name = name

	if err := m.db.WithContext(ctx).Save(&list).Error; err != nil {
		return model.FavoritesList{}, err
	}

	return list, nil
}

func (m manager) DeleteList(ctx context.Context, id string) error {
	res := m.db.WithContext(ctx).Where("id = ?", id).Delete(&model.FavoritesList{})
	if res.Error != nil {
		return res.Error
	}

	if res.RowsAffected == 0 {
		return ErrNotFound
	}

	return nil
}

func (m manager) SetFavorite(ctx context.Context, infoHash protocol.ID, listID string) error {
	favorite := model.TorrentFavorite{
		InfoHash:        infoHash,
		FavoritesListID: listID,
	}

	return m.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "info_hash"}},
		DoUpdates: clause.AssignmentColumns([]string{"favorites_list_id"}),
	}).Create(&favorite).Error
}

func (m manager) RemoveFavorite(ctx context.Context, infoHash protocol.ID) error {
	return m.db.WithContext(ctx).Where("info_hash = ?", infoHash).Delete(&model.TorrentFavorite{}).Error
}

func (m manager) findList(ctx context.Context, id string) (model.FavoritesList, error) {
	var list model.FavoritesList

	err := m.db.WithContext(ctx).Where("id = ?", id).First(&list).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.FavoritesList{}, ErrNotFound
	}

	return list, err
}
