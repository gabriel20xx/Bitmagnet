package mediastream

import (
	"os"
	"path/filepath"
	"time"
)

// Config controls the on-demand media streaming subsystem, which downloads piece data
// directly from torrent peers so image/audio/video/text files can be previewed in the
// browser without waiting for a full download.
type Config struct {
	// DataDir is where in-flight piece data is cached on disk while streaming.
	DataDir string
	// MaxConcurrentStreams caps how many files can be streamed at once, to bound
	// peer connections and disk/bandwidth usage.
	MaxConcurrentStreams uint
	// IdleTimeout is how long a torrent is kept active in the streaming client after
	// its last read, before its peer connections are dropped and its cached data is freed.
	IdleTimeout time.Duration
	// ReadaheadBytes is how far ahead of the current read position pieces are
	// proactively downloaded, to keep playback smooth.
	ReadaheadBytes int64
	// MetadataTimeout is how long to wait for peers to hand over the torrent's info dict
	// (piece hashes/file list) before giving up. Only relevant when we don't already have
	// piece data saved locally, since that's otherwise fetched live over BEP-9.
	MetadataTimeout time.Duration
	// ArchiveSpoolDir is where decompressed archive-entry content is spooled to disk before
	// being served, so previewing a file inside an archive can still support HTTP range
	// requests the same way whole-file previews do. Deliberately separate from DataDir,
	// which the underlying torrent client manages for its own piece storage.
	ArchiveSpoolDir string
	// MaxArchiveEntrySpoolBytes caps how much decompressed data a single archive entry may
	// produce before spooling is aborted. Archive formats can lie about an entry's declared
	// size, so this is enforced against actual bytes copied, not the header's claim.
	MaxArchiveEntrySpoolBytes int64
	// MaxArchiveEntries caps how many entries a single archive listing may return.
	MaxArchiveEntries int
}

func NewDefaultConfig() Config {
	return Config{
		DataDir:                   filepath.Join(os.TempDir(), "bitmagnet", "mediastream"),
		MaxConcurrentStreams:      4,
		IdleTimeout:               5 * time.Minute,
		ReadaheadBytes:            8 * 1024 * 1024,
		MetadataTimeout:           30 * time.Second,
		ArchiveSpoolDir:           filepath.Join(os.TempDir(), "bitmagnet", "mediastream-archive-spool"),
		MaxArchiveEntrySpoolBytes: 2 << 30, // 2GiB
		MaxArchiveEntries:         10_000,
	}
}
