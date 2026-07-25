// Package archive lists and extracts entries from archive files (zip, with more formats
// following in a later phase) whose bytes are fetched on demand from BitTorrent peers - see
// internal/mediastream - rather than downloaded and stored ahead of time. Not every archive
// format allows the same access pattern: zip stores its directory metadata in a trailer, so
// listing it only needs a small read at the end of the file. Formats handled sequentially
// (rar, tar - added in a later phase) have no such trailer and require reading through the
// entire byte stream just to enumerate their contents.
package archive

import (
	"errors"
	"fmt"
	"io"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

var (
	ErrArchiveCorrupt   = errors.New("archive is corrupt or not a valid archive")
	ErrArchiveEncrypted = errors.New("archive entry is password protected")
	ErrEntryNotFound    = errors.New("entry not found in archive")
)

// Entry is one file inside an archive. Index is the stable identifier for addressing this
// entry (e.g. in the archiveEntries GraphQL field and the entry-stream REST route) - Path is
// display-only, since archive filenames aren't guaranteed to be valid UTF-8 (legacy
// CP437/OEM-encoded zips are common) and some formats permit duplicate names.
type Entry struct {
	Index    int
	Path     string
	Size     int64
	FileType model.NullFileType
}

// Reader lists and opens the entries of a single archive.
type Reader interface {
	Entries() []Entry
	// Open returns a sequential, decompressing reader for the entry at index - never
	// seekable, regardless of format.
	Open(index int) (io.ReadCloser, error)
}

// Format identifies a supported archive container.
type Format string

const (
	FormatZip Format = "zip"
)

// IsSequential reports whether listing this format's entries requires reading through its
// entire underlying byte stream, as opposed to a cheap read of a trailer. Always false today
// (zip only) - relevant once sequential-only formats (rar, tar) land in a later phase.
func (f Format) IsSequential() bool {
	return false
}

// DetectFormat returns the archive format implied by name's extension, if any. This is a
// deliberate allowlist independent of model.FileTypeFromExtension - some of that
// classification's "archive" extensions (like .iso, a filesystem image rather than a
// compressed archive) are intentionally never dispatched here.
func DetectFormat(name string) (Format, bool) {
	ext := model.FileExtensionFromPath(name)
	if !ext.Valid {
		return "", false
	}

	switch ext.String {
	case "zip":
		return FormatZip, true
	default:
		return "", false
	}
}

// Open parses the archive in r (of the given size) according to format.
func Open(format Format, r io.ReaderAt, size int64) (Reader, error) {
	switch format {
	case FormatZip:
		return openZip(r, size)
	default:
		return nil, fmt.Errorf("unsupported archive format: %s", format)
	}
}

// OpenSeekable is a convenience for callers (like internal/mediastream) that only have an
// io.ReadSeeker - e.g. a piece-fetching torrent file reader - rather than a native
// io.ReaderAt. The returned Reader is only as safe for concurrent use as the adapter: all
// reads through it are serialized.
func OpenSeekable(format Format, r io.ReadSeeker, size int64) (Reader, error) {
	return Open(format, newReaderAtAdapter(r), size)
}

func fileTypeFromName(name string) model.NullFileType {
	ext := model.FileExtensionFromPath(name)
	if !ext.Valid {
		return model.NullFileType{}
	}

	return model.FileTypeFromExtension(ext.String)
}
