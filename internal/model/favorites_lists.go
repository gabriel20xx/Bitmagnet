package model

import "time"

const TableNameFavoritesList = "favorites_lists"

// FavoritesList is a user-defined, named collection that torrents can be favorited into.
type FavoritesList struct {
	ID        string    `gorm:"column:id;primaryKey;default:gen_random_uuid();<-:false" json:"id"`
	Name      string    `gorm:"column:name;not null" json:"name"`
	CreatedAt time.Time `gorm:"column:created_at;not null;<-:create" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at;not null" json:"updatedAt"`
}

func (*FavoritesList) TableName() string {
	return TableNameFavoritesList
}
