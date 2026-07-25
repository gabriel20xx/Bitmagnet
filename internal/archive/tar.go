package archive

import (
	"archive/tar"
	"errors"
	"fmt"
	"io"
)

// tarReader mirrors rarReader's approach: tar has no random access either, so both Entries
// (built once, eagerly) and every Open call Seek back to the start and sequentially re-read
// headers to reach the entry they need.
type tarReader struct {
	r       io.ReadSeeker
	entries []Entry
}

func openTar(r io.ReadSeeker) (Reader, error) {
	entries, err := scanTarEntries(r)
	if err != nil {
		return nil, err
	}

	return &tarReader{r: r, entries: entries}, nil
}

func scanTarEntries(r io.ReadSeeker) ([]Entry, error) {
	if _, seekErr := r.Seek(0, io.SeekStart); seekErr != nil {
		return nil, seekErr
	}

	tr := tar.NewReader(r)

	var entries []Entry

	for index := 0; ; index++ {
		hdr, nextErr := tr.Next()
		if errors.Is(nextErr, io.EOF) {
			break
		}

		if nextErr != nil {
			return nil, fmt.Errorf("%w: %w", ErrArchiveCorrupt, nextErr)
		}

		// Only regular files are listed - symlinks, hardlinks, directories, and device
		// entries are never something Open should be asked to hand back file content for.
		if hdr.Typeflag != tar.TypeReg {
			continue
		}

		entries = append(entries, Entry{
			Index:    index,
			Path:     hdr.Name,
			Size:     hdr.Size,
			FileType: fileTypeFromName(hdr.Name),
		})
	}

	return entries, nil
}

func (z *tarReader) Entries() []Entry {
	return z.entries
}

func (z *tarReader) Open(index int) (io.ReadCloser, error) {
	if index < 0 {
		return nil, ErrEntryNotFound
	}

	if _, seekErr := z.r.Seek(0, io.SeekStart); seekErr != nil {
		return nil, seekErr
	}

	tr := tar.NewReader(z.r)

	for i := 0; ; i++ {
		hdr, nextErr := tr.Next()
		if errors.Is(nextErr, io.EOF) {
			return nil, ErrEntryNotFound
		}

		if nextErr != nil {
			return nil, fmt.Errorf("%w: %w", ErrArchiveCorrupt, nextErr)
		}

		if i != index {
			continue
		}

		if hdr.Typeflag != tar.TypeReg {
			return nil, ErrEntryNotFound
		}

		return io.NopCloser(tr), nil
	}
}
