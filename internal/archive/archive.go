// Package archive lists and extracts entries from archive files (zip, 7z, rar, tar) whose
// bytes are fetched on demand from BitTorrent peers - see internal/mediastream - rather than
// downloaded and stored ahead of time. Not every archive format allows the same access
// pattern: zip and 7z store their directory metadata in a trailer, so listing them only
// needs a small read at the end of the file. rar and tar have no such trailer and require
// reading through the entire byte stream just to enumerate their contents - see
// Format.IsSequential.
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
	FormatZip    Format = "zip"
	FormatSevenZ Format = "7z"
	FormatRar    Format = "rar"
	FormatTar    Format = "tar"
)

// IsSequential reports whether listing this format's entries requires reading through its
// entire underlying byte stream, as opposed to a cheap read of a trailer. zip and 7z store a
// central directory/trailer and are never sequential; rar and tar have no such structure -
// for a torrent file streamed live from peers, expanding one of these can mean pulling the
// archive's entire contents over the wire just to see what's inside, not just a quick peek.
func (f Format) IsSequential() bool {
	switch f {
	case FormatRar, FormatTar:
		return true
	default:
		return false
	}
}

// DetectFormat returns the archive format implied by name's extension, if any. This is a
// deliberate allowlist independent of model.FileTypeFromExtension - some of that
// classification's "archive" extensions are intentionally never dispatched here: .iso is a
// filesystem image rather than a compressed archive, and standalone .gz/.bz2 are ambiguous
// (a plain single compressed file vs. a tar archive compressed on top - e.g. "data.csv.gz"
// vs. "backup.tar.gz" share the same last extension) so browsing them isn't supported yet.
func DetectFormat(name string) (Format, bool) {
	ext := model.FileExtensionFromPath(name)
	if !ext.Valid {
		return "", false
	}

	switch ext.String {
	case "zip":
		return FormatZip, true
	case "7z":
		return FormatSevenZ, true
	case "rar":
		return FormatRar, true
	case "tar":
		return FormatTar, true
	default:
		return "", false
	}
}

// Open parses the archive in r (of the given size) according to format. zip/7z need random
// access to their trailer and wrap r in an adapter; rar/tar only ever read sequentially from
// the start, but still need to Seek back to 0 whenever Open(index) is called, since none of
// these libraries support resuming a partial scan or seeking within their own decompressed
// entry streams.
func Open(format Format, r io.ReadSeeker, size int64) (Reader, error) {
	switch format {
	case FormatZip:
		return openZip(newReaderAtAdapter(r), size)
	case FormatSevenZ:
		return openSevenZip(newReaderAtAdapter(r), size)
	case FormatRar:
		return openRar(r)
	case FormatTar:
		return openTar(r)
	default:
		return nil, fmt.Errorf("unsupported archive format: %s", format)
	}
}

func fileTypeFromName(name string) model.NullFileType {
	ext := model.FileExtensionFromPath(name)
	if !ext.Valid {
		return model.NullFileType{}
	}

	return model.FileTypeFromExtension(ext.String)
}
