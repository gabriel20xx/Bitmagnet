package archive

import (
	"errors"
	"fmt"
	"io"

	"github.com/bodgit/sevenzip"
)

type sevenZipReader struct {
	files   []*sevenzip.File
	entries []Entry
}

func openSevenZip(r io.ReaderAt, size int64) (Reader, error) {
	zr, err := sevenzip.NewReader(r, size)
	if err != nil {
		return nil, wrapSevenZipError(err)
	}

	entries := make([]Entry, 0, len(zr.File))

	for i, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}

		//nolint:gosec // uint64 -> int64, files large enough to overflow aren't realistic here
		entries = append(entries, Entry{
			Index:    i,
			Path:     f.Name,
			Size:     int64(f.UncompressedSize),
			FileType: fileTypeFromName(f.Name),
		})
	}

	return &sevenZipReader{files: zr.File, entries: entries}, nil
}

func (z *sevenZipReader) Entries() []Entry {
	return z.entries
}

func (z *sevenZipReader) Open(index int) (io.ReadCloser, error) {
	if index < 0 || index >= len(z.files) {
		return nil, ErrEntryNotFound
	}

	f := z.files[index]
	if f.FileInfo().IsDir() {
		return nil, ErrEntryNotFound
	}

	rc, err := f.Open()
	if err != nil {
		return nil, wrapSevenZipError(err)
	}

	return rc, nil
}

// wrapSevenZipError distinguishes "this needs a password" from a genuinely corrupt archive.
// Unlike zip's flag bit, 7z encryption (whole-archive header encryption, or per-entry) isn't
// visible from Entry metadata alone - it only surfaces as this wrapped error, either when
// opening the reader (header-encrypted archives fail immediately) or per entry.
func wrapSevenZipError(err error) error {
	var readErr sevenzip.ReadError
	if errors.As(err, &readErr) && readErr.Encrypted {
		return ErrArchiveEncrypted
	}

	return fmt.Errorf("%w: %w", ErrArchiveCorrupt, err)
}
