package processor

import (
	"context"
	"database/sql/driver"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
	"github.com/bitmagnet-io/bitmagnet/internal/slice"
	"gorm.io/gorm/clause"
)

type persistPayload struct {
	torrentContents  []model.TorrentContent
	deleteIDs        []string
	deleteInfoHashes []protocol.ID
	addTags          map[protocol.ID]map[string]struct{}
}

func (c processor) persist(ctx context.Context, payload persistPayload) error {
	torrentTagsPtr := make([]*model.TorrentTag, 0, len(payload.addTags))

	for infoHash, tags := range payload.addTags {
		for tag := range tags {
			torrentTagsPtr = append(torrentTagsPtr, &model.TorrentTag{
				InfoHash: infoHash,
				Name:     tag,
			})
		}
	}

	if len(payload.deleteInfoHashes) > 0 {
		if blockErr := c.blockingManager.Block(ctx, payload.deleteInfoHashes, false); blockErr != nil {
			return blockErr
		}
	}

	return c.dao.Transaction(func(tx *dao.Query) error {
		// Resolved here, inside the transaction, while tc.Torrent (in particular its
		// FileFingerprint) is still populated - the copies made below clear it.
		tcs := make([]*model.TorrentContent, len(payload.torrentContents))

		for i := range payload.torrentContents {
			tcCopy := payload.torrentContents[i]
			tcs[i] = &tcCopy
		}

		touchedCanonicals, dedupErr := resolveDuplicates(ctx, tx, tcs)
		if dedupErr != nil {
			return dedupErr
		}

		contentsMap := make(map[model.ContentRef]struct{}, len(tcs))
		contentsPtr := make([]*model.Content, 0, len(tcs))
		torrentContentsPtr := make([]*model.TorrentContent, 0, len(tcs))

		for _, tc := range tcs {
			if tc.ContentID.Valid && tc.Content.CreatedAt.IsZero() {
				contentRef := tc.Content.Ref()
				if _, ok := contentsMap[contentRef]; !ok {
					contentsMap[contentRef] = struct{}{}
					contentCopy := tc.Content
					contentsPtr = append(contentsPtr, &contentCopy)
				}
			}

			tcCopy := *tc
			tcCopy.Torrent = model.Torrent{}
			tcCopy.Content = model.Content{}
			torrentContentsPtr = append(torrentContentsPtr, &tcCopy)
		}

		if len(contentsPtr) > 0 {
			if createContentErr := tx.Content.WithContext(ctx).Clauses(
				clause.OnConflict{
					UpdateAll: true,
				}).CreateInBatches(contentsPtr, 100); createContentErr != nil {
				return createContentErr
			}
		}

		if len(payload.deleteIDs) > 0 {
			if _, deleteErr := tx.TorrentContent.WithContext(ctx).Where(
				c.dao.TorrentContent.ID.In(payload.deleteIDs...),
			).Delete(); deleteErr != nil {
				return deleteErr
			}
		}

		if len(torrentContentsPtr) > 0 {
			if createErr := tx.TorrentContent.WithContext(ctx).Clauses(
				clause.OnConflict{
					UpdateAll: true,
				},
			).CreateInBatches(torrentContentsPtr, 100); createErr != nil {
				return createErr
			}
		}

		// duplicates_count is reset to its zero value by the UpdateAll upsert above whenever a
		// row is (re)written, so recompute it for every row just written - not just the
		// canonicals newly pointed at - to self-heal that reset.
		recomputeSet := make(map[protocol.ID]struct{}, len(tcs)+len(touchedCanonicals))
		for _, tc := range tcs {
			recomputeSet[tc.InfoHash] = struct{}{}
		}

		for _, infoHash := range touchedCanonicals {
			recomputeSet[infoHash] = struct{}{}
		}

		if len(recomputeSet) > 0 {
			recomputeInfoHashes := make([]protocol.ID, 0, len(recomputeSet))
			for infoHash := range recomputeSet {
				recomputeInfoHashes = append(recomputeInfoHashes, infoHash)
			}

			if recomputeErr := recomputeDuplicatesCount(ctx, tx, recomputeInfoHashes); recomputeErr != nil {
				return recomputeErr
			}
		}

		if len(torrentTagsPtr) > 0 {
			if createErr := tx.TorrentTag.WithContext(ctx).Clauses(
				clause.OnConflict{
					DoNothing: true,
				},
			).CreateInBatches(torrentTagsPtr, 100); createErr != nil {
				return createErr
			}
		}

		if len(payload.deleteInfoHashes) > 0 {
			valuers := slice.Map(payload.deleteInfoHashes, func(infoHash protocol.ID) driver.Valuer {
				return infoHash
			})

			if _, deleteErr := tx.Torrent.WithContext(ctx).Where(
				c.dao.Torrent.InfoHash.In(valuers...),
			).Delete(); deleteErr != nil {
				return deleteErr
			}
		}

		return nil
	})
}
