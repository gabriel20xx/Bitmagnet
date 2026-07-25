package mediastream

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

func newTestService(t *testing.T) *Service {
	t.Helper()

	dir := t.TempDir()

	return &Service{
		config: Config{
			ArchiveSpoolDir:           dir,
			MaxArchiveEntrySpoolBytes: 1024,
			IdleTimeout:               time.Minute,
		},
		archiveSpool: make(map[string]*spooledEntry),
		logger:       zap.NewNop().Sugar(),
	}
}

func writeSpooledFile(t *testing.T, dir, content string) string {
	t.Helper()

	f, err := os.CreateTemp(dir, "entry-*")
	require.NoError(t, err)
	_, err = f.WriteString(content)
	require.NoError(t, err)
	require.NoError(t, f.Close())

	return f.Name()
}

func TestSpoolToDiskWritesContent(t *testing.T) {
	s := newTestService(t)

	spooled, err := s.spoolToDisk("file.txt", strings.NewReader("hello world"))
	require.NoError(t, err)
	defer os.Remove(spooled.path)

	assert.Equal(t, int64(len("hello world")), spooled.size)
	assert.Equal(t, "file.txt", spooled.name)
	assert.Equal(t, 1, spooled.refCount)

	data, readErr := os.ReadFile(spooled.path)
	require.NoError(t, readErr)
	assert.Equal(t, "hello world", string(data))
}

func TestSpoolToDiskEnforcesSizeCap(t *testing.T) {
	s := newTestService(t)
	s.config.MaxArchiveEntrySpoolBytes = 4

	spooled, err := s.spoolToDisk("big.bin", strings.NewReader("this is way more than 4 bytes"))
	assert.ErrorIs(t, err, ErrArchiveEntryTooLarge)
	assert.Nil(t, spooled)

	entries, readDirErr := os.ReadDir(s.config.ArchiveSpoolDir)
	require.NoError(t, readDirErr)
	assert.Empty(t, entries, "the partial spool file must be cleaned up when the cap is exceeded")
}

func TestStoreSpooledEntryDeduplicatesConcurrentSpool(t *testing.T) {
	s := newTestService(t)

	first := &spooledEntry{path: writeSpooledFile(t, s.config.ArchiveSpoolDir, "first"), refCount: 1}
	stored := s.storeSpooledEntry("key", first)
	assert.Same(t, first, stored)

	second := &spooledEntry{path: writeSpooledFile(t, s.config.ArchiveSpoolDir, "second"), refCount: 1}
	result := s.storeSpooledEntry("key", second)

	// The redundant spool (from a concurrent request racing the first) is discarded, and
	// the earlier one is reused instead - its refcount reflects both callers now holding it.
	assert.Same(t, first, result)
	assert.Equal(t, 2, first.refCount)
	_, statErr := os.Stat(second.path)
	assert.True(t, os.IsNotExist(statErr), "the discarded duplicate's file must be removed")
}

func TestGetSpooledEntryHitIncrementsRefCount(t *testing.T) {
	s := newTestService(t)
	entry := &spooledEntry{path: writeSpooledFile(t, s.config.ArchiveSpoolDir, "x"), refCount: 1}
	s.archiveSpool["key"] = entry

	got, ok := s.getSpooledEntry("key")
	require.True(t, ok)
	assert.Same(t, entry, got)
	assert.Equal(t, 2, entry.refCount)
}

func TestGetSpooledEntryMiss(t *testing.T) {
	s := newTestService(t)

	_, ok := s.getSpooledEntry("missing")
	assert.False(t, ok)
}

func TestGetSpooledEntryEvictsStaleCacheRow(t *testing.T) {
	s := newTestService(t)
	path := writeSpooledFile(t, s.config.ArchiveSpoolDir, "x")
	s.archiveSpool["key"] = &spooledEntry{path: path, refCount: 0}

	require.NoError(t, os.Remove(path)) // simulate the file having been swept already

	_, ok := s.getSpooledEntry("key")
	assert.False(t, ok)
	_, stillCached := s.archiveSpool["key"]
	assert.False(t, stillCached, "a cache row pointing at a missing file must be dropped, not just reported as a miss")
}

func TestReleaseSpooledEntryDecrementsRefCount(t *testing.T) {
	s := newTestService(t)
	entry := &spooledEntry{refCount: 2}
	s.archiveSpool["key"] = entry

	s.releaseSpooledEntry("key")
	assert.Equal(t, 1, entry.refCount)
}

func TestEvictIdleArchiveSpoolSkipsInUseEntries(t *testing.T) {
	s := newTestService(t)
	path := writeSpooledFile(t, s.config.ArchiveSpoolDir, "x")
	s.archiveSpool["key"] = &spooledEntry{path: path, refCount: 1, lastAccess: time.Now().Add(-time.Hour)}

	s.evictIdleArchiveSpool()

	_, stillCached := s.archiveSpool["key"]
	assert.True(t, stillCached, "an entry still being read must never be evicted regardless of age")
	_, statErr := os.Stat(path)
	assert.NoError(t, statErr)
}

func TestEvictIdleArchiveSpoolSkipsRecentlyUsedEntries(t *testing.T) {
	s := newTestService(t)
	path := writeSpooledFile(t, s.config.ArchiveSpoolDir, "x")
	s.archiveSpool["key"] = &spooledEntry{path: path, refCount: 0, lastAccess: time.Now()}

	s.evictIdleArchiveSpool()

	_, stillCached := s.archiveSpool["key"]
	assert.True(t, stillCached)
}

func TestEvictIdleArchiveSpoolRemovesIdleUnusedEntries(t *testing.T) {
	s := newTestService(t)
	path := writeSpooledFile(t, s.config.ArchiveSpoolDir, "x")
	s.archiveSpool["key"] = &spooledEntry{path: path, refCount: 0, lastAccess: time.Now().Add(-time.Hour)}

	s.evictIdleArchiveSpool()

	_, stillCached := s.archiveSpool["key"]
	assert.False(t, stillCached)
	_, statErr := os.Stat(path)
	assert.True(t, os.IsNotExist(statErr))
}

func TestSweepOrphanedSpoolFilesRemovesEverythingInDir(t *testing.T) {
	dir := t.TempDir()
	writeSpooledFile(t, dir, "a")
	writeSpooledFile(t, dir, "b")
	require.NoError(t, os.Mkdir(filepath.Join(dir, "subdir"), 0o755))

	require.NoError(t, sweepOrphanedSpoolFiles(dir))

	entries, err := os.ReadDir(dir)
	require.NoError(t, err)
	require.Len(t, entries, 1, "only the (untouched) subdirectory should remain")
	assert.Equal(t, "subdir", entries[0].Name())
}
