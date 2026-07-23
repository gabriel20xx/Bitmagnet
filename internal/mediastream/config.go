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
}

func NewDefaultConfig() Config {
	return Config{
		DataDir:              filepath.Join(os.TempDir(), "bitmagnet", "mediastream"),
		MaxConcurrentStreams: 4,
		IdleTimeout:          5 * time.Minute,
		ReadaheadBytes:       8 * 1024 * 1024,
	}
}
