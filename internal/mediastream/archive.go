package mediastream

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/bitmagnet-io/bitmagnet/internal/archive"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

var (
	ErrNotAnArchive         = errors.New("file is not a supported archive format")
	ErrArchiveEntryTooLarge = errors.New("archive entry exceeds the maximum allowed size")
	ErrTooManyEntries       = errors.New("archive has too many entries to list")
)

// spooledEntry is a previously-decompressed archive entry cached on disk, so that the
// multiple HTTP requests one media preview generates (an availability preflight, the
// actual playback, every scrub) don't each independently re-fetch and re-decompress the
// same entry from scratch.
type spooledEntry struct {
	path       string
	name       string
	size       int64
	refCount   int
	lastAccess time.Time
}

// ListArchive lists the entries of the archive file at index within t. The concurrency
// slot is held only long enough to read the archive's directory metadata - for zip that's
// a small trailer read - since no further network activity is needed once the listing is
// known, unlike an open preview stream which keeps touching the live peer connection for
// as long as it's read.
func (s *Service) ListArchive(ctx context.Context, t *model.Torrent, index uint) ([]archive.Entry, error) {
	name, size, _, resolveErr := resolveFile(t, index)
	if resolveErr != nil {
		return nil, resolveErr
	}

	format, ok := archive.DetectFormat(name)
	if !ok {
		return nil, ErrNotAnArchive
	}

	file, key, handleErr := s.openFileHandle(ctx, t, index)
	if handleErr != nil {
		return nil, handleErr
	}

	reader := file.NewReader()
	defer reader.Close()
	defer s.releaseSlot(key)

	reader.SetContext(ctx)
	reader.SetResponsive()
	reader.SetReadahead(s.config.ReadaheadBytes)

	archiveReader, openErr := archive.Open(format, reader, size)
	if openErr != nil {
		return nil, openErr
	}

	entries := archiveReader.Entries()
	if len(entries) > s.config.MaxArchiveEntries {
		return nil, ErrTooManyEntries
	}

	return entries, nil
}

// OpenArchiveEntry resolves the entry at entryIndex inside the archive file at index
// within t, and returns a Stream serving its decompressed content. Since none of the
// supported archive formats expose a seekable per-entry reader, the entry is fully
// decompressed to a local temp file (spooled) before being served - the returned Stream is
// backed by that file, so callers (e.g. http.ServeContent) still get full range/seek
// support. Callers must Close the returned Stream once done reading it.
func (s *Service) OpenArchiveEntry(ctx context.Context, t *model.Torrent, index uint, entryIndex int) (*Stream, error) {
	name, size, _, resolveErr := resolveFile(t, index)
	if resolveErr != nil {
		return nil, resolveErr
	}

	format, ok := archive.DetectFormat(name)
	if !ok {
		return nil, ErrNotAnArchive
	}

	cacheKey := archiveSpoolKey(t.InfoHash.String(), index, entryIndex)

	if spooled, ok := s.getSpooledEntry(cacheKey); ok {
		return s.openSpooledStream(cacheKey, spooled)
	}

	spooled, spoolErr := s.spoolArchiveEntry(ctx, t, index, format, size, entryIndex, cacheKey)
	if spoolErr != nil {
		return nil, spoolErr
	}

	return s.openSpooledStream(cacheKey, spooled)
}

func (s *Service) spoolArchiveEntry(
	ctx context.Context,
	t *model.Torrent,
	index uint,
	format archive.Format,
	size int64,
	entryIndex int,
	cacheKey string,
) (*spooledEntry, error) {
	file, key, handleErr := s.openFileHandle(ctx, t, index)
	if handleErr != nil {
		return nil, handleErr
	}

	reader := file.NewReader()
	defer reader.Close()
	defer s.releaseSlot(key)

	reader.SetContext(ctx)
	reader.SetResponsive()
	reader.SetReadahead(s.config.ReadaheadBytes)

	archiveReader, openErr := archive.Open(format, reader, size)
	if openErr != nil {
		return nil, openErr
	}

	var entry *archive.Entry

	for _, e := range archiveReader.Entries() {
		if e.Index == entryIndex {
			entry = &e

			break
		}
	}

	if entry == nil {
		return nil, archive.ErrEntryNotFound
	}

	entryName := pathBaseName(entry.Path)
	if !isPreviewable(entry.FileType) && !isTextFile(entryName) {
		return nil, ErrFileNotPreviewable
	}

	entryReader, openEntryErr := archiveReader.Open(entryIndex)
	if openEntryErr != nil {
		return nil, openEntryErr
	}
	defer entryReader.Close()

	spooled, spoolErr := s.spoolToDisk(entryName, entryReader)
	if spoolErr != nil {
		return nil, spoolErr
	}

	return s.storeSpooledEntry(cacheKey, spooled), nil
}

// spoolToDisk fully decompresses r to a fresh temp file, hard-capped at
// MaxArchiveEntrySpoolBytes regardless of what the entry's header claims its size is - a
// decompression bomb keeps producing bytes past whatever it declares, so the limit is
// enforced against bytes actually copied.
func (s *Service) spoolToDisk(name string, r io.Reader) (*spooledEntry, error) {
	tmp, createErr := os.CreateTemp(s.config.ArchiveSpoolDir, "entry-*")
	if createErr != nil {
		return nil, fmt.Errorf("creating archive spool file: %w", createErr)
	}

	limited := io.LimitReader(r, s.config.MaxArchiveEntrySpoolBytes+1)

	written, copyErr := io.Copy(tmp, limited)
	if copyErr != nil {
		_ = tmp.Close()
		_ = os.Remove(tmp.Name())

		return nil, fmt.Errorf("spooling archive entry: %w", copyErr)
	}

	if written > s.config.MaxArchiveEntrySpoolBytes {
		_ = tmp.Close()
		_ = os.Remove(tmp.Name())

		return nil, ErrArchiveEntryTooLarge
	}

	if closeErr := tmp.Close(); closeErr != nil {
		_ = os.Remove(tmp.Name())

		return nil, fmt.Errorf("closing archive spool file: %w", closeErr)
	}

	return &spooledEntry{path: tmp.Name(), name: name, size: written, refCount: 1, lastAccess: time.Now()}, nil
}

// storeSpooledEntry registers a freshly-spooled entry in the cache, unless a concurrent
// request for the same entry already beat it there - in which case the redundant copy is
// discarded (rather than leaked, or silently clobbering the copy other requests may
// already be reading) and the existing one is reused instead.
func (s *Service) storeSpooledEntry(cacheKey string, spooled *spooledEntry) *spooledEntry {
	s.archiveMu.Lock()
	defer s.archiveMu.Unlock()

	if existing, ok := s.archiveSpool[cacheKey]; ok {
		existing.refCount++
		existing.lastAccess = time.Now()
		_ = os.Remove(spooled.path)

		return existing
	}

	s.archiveSpool[cacheKey] = spooled

	return spooled
}

func (s *Service) getSpooledEntry(cacheKey string) (*spooledEntry, bool) {
	s.archiveMu.Lock()
	defer s.archiveMu.Unlock()

	spooled, ok := s.archiveSpool[cacheKey]
	if !ok {
		return nil, false
	}

	// The idle-eviction sweep could have removed the file out from under a stale cache
	// entry between ticks; confirm it's still actually there rather than serving a stream
	// that will 404 on first read.
	if _, statErr := os.Stat(spooled.path); statErr != nil {
		delete(s.archiveSpool, cacheKey)

		return nil, false
	}

	spooled.refCount++
	spooled.lastAccess = time.Now()

	return spooled, true
}

func (s *Service) releaseSpooledEntry(cacheKey string) {
	s.archiveMu.Lock()
	defer s.archiveMu.Unlock()

	spooled, ok := s.archiveSpool[cacheKey]
	if !ok {
		return
	}

	spooled.refCount--
	spooled.lastAccess = time.Now()
}

func (s *Service) openSpooledStream(cacheKey string, spooled *spooledEntry) (*Stream, error) {
	f, openErr := os.Open(spooled.path)
	if openErr != nil {
		return nil, fmt.Errorf("opening spooled archive entry: %w", openErr)
	}

	return &Stream{
		Reader: f,
		Name:   spooled.name,
		Size:   spooled.size,
		closeFns: []func() error{
			f.Close,
			func() error {
				s.releaseSpooledEntry(cacheKey)

				return nil
			},
		},
	}, nil
}

func (s *Service) evictIdleArchiveSpool() {
	s.archiveMu.Lock()
	defer s.archiveMu.Unlock()

	now := time.Now()

	for key, spooled := range s.archiveSpool {
		if spooled.refCount > 0 {
			continue
		}

		if now.Sub(spooled.lastAccess) <= s.config.IdleTimeout {
			continue
		}

		if removeErr := os.Remove(spooled.path); removeErr != nil && !os.IsNotExist(removeErr) {
			s.logger.Warnw("failed to remove idle archive spool file", "path", spooled.path, "error", removeErr)
		}

		delete(s.archiveSpool, key)
	}
}

func archiveSpoolKey(infoHash string, index uint, entryIndex int) string {
	return fmt.Sprintf("%s/%d/%d", infoHash, index, entryIndex)
}

// sweepOrphanedSpoolFiles removes every file left in dir from a previous process - nothing
// in a freshly-started Service could have registered a cache entry yet, so anything found
// here can only be debris from a crash that skipped cleanup.
func sweepOrphanedSpoolFiles(dir string) error {
	entries, readErr := os.ReadDir(dir)
	if readErr != nil {
		return readErr
	}

	for _, e := range entries {
		if e.IsDir() {
			continue
		}

		_ = os.Remove(filepath.Join(dir, e.Name()))
	}

	return nil
}
