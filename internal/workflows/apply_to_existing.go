package workflows

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"gorm.io/gorm/clause"
)

const ApplyToExistingMessageName = "apply_workflow_to_existing"

// ApplyToExistingPageSize caps how many already-classified torrents a single job invocation
// evaluates before re-enqueuing itself for the next page, keeping each run within the handler's
// job timeout regardless of library size.
const ApplyToExistingPageSize = 200

type ApplyToExistingMessageParams struct {
	WorkflowID string `json:"workflowId"`
	// Page is 0-based.
	Page uint `json:"page,omitempty"`
}

func NewApplyToExistingQueueJob(msg ApplyToExistingMessageParams) (model.QueueJob, error) {
	return model.NewQueueJob(ApplyToExistingMessageName, msg, model.QueueJobMaxRetries(2))
}

func (m manager) ApplyToExisting(ctx context.Context, id string) error {
	if _, err := m.find(ctx, id); err != nil {
		return err
	}

	job, jobErr := NewApplyToExistingQueueJob(ApplyToExistingMessageParams{WorkflowID: id})
	if jobErr != nil {
		return jobErr
	}

	return m.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&job).Error
}
