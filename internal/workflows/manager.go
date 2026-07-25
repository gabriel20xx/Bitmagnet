package workflows

import (
	"gorm.io/gorm"
)

type manager struct {
	db *gorm.DB
}
