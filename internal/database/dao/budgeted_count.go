package dao

import (
	"gorm.io/gorm"
)

func ToSQL(db *gorm.DB) string {
	return db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Find(&[]interface{}{})
	})
}

type BudgetedCountResult struct {
	Count          int64
	Cost           float64
	BudgetExceeded bool
}

// Uses Scan (rather than Row+manual scan) so this query runs through gorm's normal
// gorm:query callback chain, which is what the gorm-cache plugin patches - Row()/Rows()
// go through a separate callback registry and would silently never be served from cache.
func BudgetedCount(db *gorm.DB, budget float64) (BudgetedCountResult, error) {
	q := ToSQL(db)

	result := BudgetedCountResult{}

	var err error
	if budget > 0 {
		err = db.Raw("SELECT count, cost, budget_exceeded from budgeted_count(?, ?)", q, budget).Scan(&result).Error
	} else {
		err = db.Raw("SELECT count(*) as count, 0 as cost, false as budget_exceeded from (" + q + ") t").Scan(&result).Error
	}

	return result, err
}
