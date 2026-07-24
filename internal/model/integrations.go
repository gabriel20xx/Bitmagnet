package model

import "time"

const TableNameIntegration = "integrations"

// Integration is a configured connection to an external BitTorrent client (e.g. qBittorrent)
// that torrents can be sent to for download.
type Integration struct {
	ID        string          `gorm:"column:id;primaryKey;default:gen_random_uuid();<-:false" json:"id"`
	Type      IntegrationType `gorm:"column:type;not null;<-:create" json:"type"`
	Name      string          `gorm:"column:name;not null" json:"name"`
	Enabled   bool            `gorm:"column:enabled;not null;default:true" json:"enabled"`
	URL       string          `gorm:"column:url;not null" json:"url"`
	Username  NullString      `gorm:"column:username" json:"username"`
	Password  NullString      `gorm:"column:password" json:"password"`
	APIKey    NullString      `gorm:"column:api_key" json:"apiKey"`
	CreatedAt time.Time       `gorm:"column:created_at;not null;<-:create" json:"createdAt"`
	UpdatedAt time.Time       `gorm:"column:updated_at;not null" json:"updatedAt"`
}

func (*Integration) TableName() string {
	return TableNameIntegration
}
