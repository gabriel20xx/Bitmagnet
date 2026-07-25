package model

import "time"

const TableNameWorkflow = "workflows"

// Workflow is a user-defined rule that automatically sends torrents matching Criteria to a
// configured Integration as soon as they're classified.
type Workflow struct {
	ID              string           `gorm:"column:id;primaryKey;default:gen_random_uuid();<-:false" json:"id"`
	Name            string           `gorm:"column:name;not null" json:"name"`
	Enabled         bool             `gorm:"column:enabled;not null;default:true" json:"enabled"`
	IntegrationID   *string          `gorm:"column:integration_id" json:"integrationId"`
	FavoritesListID *string          `gorm:"column:favorites_list_id" json:"favoritesListId"`
	MatchOnRematch  bool             `gorm:"column:match_on_rematch;not null;default:false" json:"matchOnRematch"`
	Criteria        WorkflowCriteria `gorm:"column:criteria;type:jsonb;serializer:json;not null" json:"criteria"`
	CreatedAt       time.Time        `gorm:"column:created_at;not null;<-:create" json:"createdAt"`
	UpdatedAt       time.Time        `gorm:"column:updated_at;not null" json:"updatedAt"`
}

func (*Workflow) TableName() string {
	return TableNameWorkflow
}
