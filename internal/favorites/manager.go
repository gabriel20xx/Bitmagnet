package favorites

import (
	"gorm.io/gorm"
)

type manager struct {
	db *gorm.DB
}
