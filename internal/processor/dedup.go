package processor

import (
	"context"
	"database/sql"
	"encoding/hex"
	"errors"
	"hash/fnv"
	"strings"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
	"gorm.io/gorm/clause"
)

// resolveDuplicates sets DuplicateOfInfoHash on each of tcs to point at an existing canonical
// torrent_content row considered the same release: preferring an exact file-listing match
// (Torrent.FileFingerprint), and falling back to the same matched content at the same quality
// (resolution/source/codec). Rows that don't match anything existing remain canonical
// (DuplicateOfInfoHash left nil). Returns the set of canonical info hashes whose duplicates_count
// needs recomputing as a result.
//
// This is a best-effort heuristic, not a strict invariant: reprocessing can change a torrent's
// classification and leave its previous followers pointed at a canonical that no longer quite
// matches them - they self-correct next time they're reprocessed. A brand new duplicate group
// being raced by two concurrent transactions (both finding no existing canonical, both trying to
// become canonical) is guarded against with a per-group Postgres advisory lock scoped to the
// enclosing transaction.
func resolveDuplicates(
	ctx context.Context, tx *dao.Query, tcs []*model.TorrentContent,
) ([]protocol.ID, error) {
	fingerprintGroups := make(map[string]protocol.ID, len(tcs))
	contentQualityGroups := make(map[string]protocol.ID, len(tcs))
	canonicalsTouched := make(map[protocol.ID]struct{}, len(tcs))

	for _, tc := range tcs {
		canonical, found, resolveErr := resolveDuplicateOf(ctx, tx, tc, fingerprintGroups, contentQualityGroups)
		if resolveErr != nil {
			return nil, resolveErr
		}

		if !found {
			tc.DuplicateOfInfoHash = nil

			continue
		}

		tc.DuplicateOfInfoHash = canonical.Bytes()
		canonicalsTouched[canonical] = struct{}{}
	}

	touched := make([]protocol.ID, 0, len(canonicalsTouched))
	for infoHash := range canonicalsTouched {
		touched = append(touched, infoHash)
	}

	return touched, nil
}

func resolveDuplicateOf(
	ctx context.Context,
	tx *dao.Query,
	tc *model.TorrentContent,
	fingerprintGroups map[string]protocol.ID,
	contentQualityGroups map[string]protocol.ID,
) (protocol.ID, bool, error) {
	if fp := tc.Torrent.FileFingerprint; len(fp) > 0 {
		key := hex.EncodeToString(fp)

		if existing, ok := fingerprintGroups[key]; ok {
			if existing != tc.InfoHash {
				return existing, true, nil
			}
		} else {
			if lockErr := acquireGroupLock(ctx, tx, "fingerprint:"+key); lockErr != nil {
				return protocol.ID{}, false, lockErr
			}

			match, found, findErr := findCanonicalByFingerprint(ctx, tx, fp, tc.InfoHash)
			if findErr != nil {
				return protocol.ID{}, false, findErr
			}

			if found {
				return match, true, nil
			}

			fingerprintGroups[key] = tc.InfoHash
		}
	}

	if tc.ContentID.Valid {
		key := contentQualityKey(tc)

		if existing, ok := contentQualityGroups[key]; ok {
			if existing != tc.InfoHash {
				return existing, true, nil
			}
		} else {
			if lockErr := acquireGroupLock(ctx, tx, "content-quality:"+key); lockErr != nil {
				return protocol.ID{}, false, lockErr
			}

			match, found, findErr := findCanonicalByContentQuality(ctx, tx, tc)
			if findErr != nil {
				return protocol.ID{}, false, findErr
			}

			if found {
				return match, true, nil
			}

			contentQualityGroups[key] = tc.InfoHash
		}
	}

	return protocol.ID{}, false, nil
}

func contentQualityKey(tc *model.TorrentContent) string {
	return strings.Join([]string{
		string(tc.ContentType.ContentType),
		tc.ContentSource.String,
		tc.ContentID.String,
		string(tc.VideoResolution.VideoResolution),
		string(tc.VideoSource.VideoSource),
		string(tc.VideoCodec.VideoCodec),
	}, "\x1f")
}

// acquireGroupLock takes a Postgres advisory lock scoped to the enclosing transaction, keyed by a
// dedup group's identity, so that two concurrent transactions resolving the same never-before-seen
// group can't both conclude "no existing canonical" and both become canonical.
func acquireGroupLock(ctx context.Context, tx *dao.Query, key string) error {
	h := fnv.New64a()
	_, _ = h.Write([]byte(key))
	lockKey := int64(h.Sum64()) //nolint:gosec // deterministic bucketing key, not a security boundary

	return tx.TorrentContent.WithContext(ctx).UnderlyingDB().
		Exec("SELECT pg_advisory_xact_lock(?)", lockKey).Error
}

func findCanonicalByFingerprint(
	ctx context.Context, tx *dao.Query, fingerprint []byte, excludeInfoHash protocol.ID,
) (protocol.ID, bool, error) {
	row := tx.TorrentContent.WithContext(ctx).UnderlyingDB().
		Joins("JOIN torrents ON torrents.info_hash = torrent_contents.info_hash").
		Where(
			"torrents.file_fingerprint = ? "+
				"AND torrent_contents.info_hash != ? "+
				"AND torrent_contents.duplicate_of_info_hash IS NULL",
			fingerprint, excludeInfoHash,
		).
		Order("torrent_contents.seeders DESC NULLS LAST, torrent_contents.created_at ASC").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Limit(1).
		Select("torrent_contents.info_hash").
		Row()

	var infoHash protocol.ID
	if scanErr := row.Scan(&infoHash); scanErr != nil {
		if errors.Is(scanErr, sql.ErrNoRows) {
			return protocol.ID{}, false, nil
		}

		return protocol.ID{}, false, scanErr
	}

	return infoHash, true, nil
}

func findCanonicalByContentQuality(
	ctx context.Context, tx *dao.Query, tc *model.TorrentContent,
) (protocol.ID, bool, error) {
	// Filters on md5(content_id), not content_id itself, so this matches the index defined in
	// migration 00023 (content_id has no length bound, so indexing it directly can exceed
	// Postgres' ~8KB index row limit). content_id = ? is kept alongside it to rule out the
	// vanishingly unlikely case of an md5 collision.
	row := tx.TorrentContent.WithContext(ctx).UnderlyingDB().
		Where(
			"content_type = ? AND content_source = ? AND md5(content_id) = md5(?) AND content_id = ? "+
				"AND info_hash != ? AND duplicate_of_info_hash IS NULL "+
				"AND video_resolution IS NOT DISTINCT FROM ? "+
				"AND video_source IS NOT DISTINCT FROM ? "+
				"AND video_codec IS NOT DISTINCT FROM ?",
			tc.ContentType, tc.ContentSource, tc.ContentID, tc.ContentID, tc.InfoHash,
			tc.VideoResolution, tc.VideoSource, tc.VideoCodec,
		).
		Order("seeders DESC NULLS LAST, created_at ASC").
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Limit(1).
		Select("info_hash").
		Row()

	var infoHash protocol.ID
	if scanErr := row.Scan(&infoHash); scanErr != nil {
		if errors.Is(scanErr, sql.ErrNoRows) {
			return protocol.ID{}, false, nil
		}

		return protocol.ID{}, false, scanErr
	}

	return infoHash, true, nil
}

// recomputeDuplicatesCount recomputes duplicates_count for each canonical row touched by a
// resolveDuplicates pass, since a new duplicate may have just been pointed at it.
func recomputeDuplicatesCount(ctx context.Context, tx *dao.Query, canonicalInfoHashes []protocol.ID) error {
	for _, infoHash := range canonicalInfoHashes {
		if execErr := tx.TorrentContent.WithContext(ctx).UnderlyingDB().Exec(
			`UPDATE torrent_contents SET duplicates_count = (
				SELECT count(*) FROM torrent_contents WHERE duplicate_of_info_hash = ?
			) WHERE info_hash = ?`,
			infoHash, infoHash,
		).Error; execErr != nil {
			return execErr
		}
	}

	return nil
}
