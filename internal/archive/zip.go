package archive

import (
	"archive/zip"
	"fmt"
	"io"
)

// zipEncryptedFlag is bit 0 of a zip entry's general-purpose flag field (APPNOTE.TXT
// section 4.4.4), set when the entry's data is encrypted. Go's stdlib archive/zip has no
// decryption support and doesn't check this itself - Open() on such an entry would just
// hand back ciphertext with no error, so this package checks it explicitly.
const zipEncryptedFlag = 0x1

type zipReader struct {
	files   []*zip.File
	entries []Entry
}

func openZip(r io.ReaderAt, size int64) (Reader, error) {
	zr, err := zip.NewReader(r, size)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", ErrArchiveCorrupt, err)
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
			Size:     int64(f.UncompressedSize64),
			FileType: fileTypeFromName(f.Name),
		})
	}

	return &zipReader{files: zr.File, entries: entries}, nil
}

func (z *zipReader) Entries() []Entry {
	return z.entries
}

func (z *zipReader) Open(index int) (io.ReadCloser, error) {
	if index < 0 || index >= len(z.files) {
		return nil, ErrEntryNotFound
	}

	f := z.files[index]
	if f.FileInfo().IsDir() {
		return nil, ErrEntryNotFound
	}

	if f.Flags&zipEncryptedFlag != 0 {
		return nil, ErrArchiveEncrypted
	}

	rc, err := f.Open()
	if err != nil {
		return nil, fmt.Errorf("%w: %w", ErrArchiveCorrupt, err)
	}

	return rc, nil
}
