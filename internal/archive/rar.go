package archive

import (
	"errors"
	"fmt"
	"io"

	rardecode "github.com/nwaples/rardecode/v2"
)

// rarReader retains the underlying stream rather than any parsed state, since rardecode has
// no random access at all: both Entries (built once, eagerly, in openRar) and every Open
// call have to Seek back to the start and sequentially re-scan headers to reach the entry
// they need - there is no way to resume or seek within a rardecode.Reader itself.
type rarReader struct {
	r       io.ReadSeeker
	entries []Entry
}

func openRar(r io.ReadSeeker) (Reader, error) {
	entries, err := scanRarEntries(r)
	if err != nil {
		return nil, err
	}

	return &rarReader{r: r, entries: entries}, nil
}

func scanRarEntries(r io.ReadSeeker) ([]Entry, error) {
	if _, seekErr := r.Seek(0, io.SeekStart); seekErr != nil {
		return nil, seekErr
	}

	rr, newErr := rardecode.NewReader(r)
	if newErr != nil {
		return nil, wrapRarError(newErr)
	}

	var entries []Entry

	for index := 0; ; index++ {
		hdr, nextErr := rr.Next()
		if errors.Is(nextErr, io.EOF) {
			break
		}

		if nextErr != nil {
			return nil, wrapRarError(nextErr)
		}

		if hdr.IsDir {
			continue
		}

		entries = append(entries, Entry{
			Index:    index,
			Path:     hdr.Name,
			Size:     hdr.UnPackedSize,
			FileType: fileTypeFromName(hdr.Name),
		})
	}

	return entries, nil
}

func (z *rarReader) Entries() []Entry {
	return z.entries
}

func (z *rarReader) Open(index int) (io.ReadCloser, error) {
	if index < 0 {
		return nil, ErrEntryNotFound
	}

	if _, seekErr := z.r.Seek(0, io.SeekStart); seekErr != nil {
		return nil, seekErr
	}

	rr, newErr := rardecode.NewReader(z.r)
	if newErr != nil {
		return nil, wrapRarError(newErr)
	}

	for i := 0; ; i++ {
		hdr, nextErr := rr.Next()
		if errors.Is(nextErr, io.EOF) {
			return nil, ErrEntryNotFound
		}

		if nextErr != nil {
			return nil, wrapRarError(nextErr)
		}

		if i != index {
			continue
		}

		if hdr.IsDir {
			return nil, ErrEntryNotFound
		}

		if hdr.Encrypted || hdr.HeaderEncrypted {
			return nil, ErrArchiveEncrypted
		}

		return io.NopCloser(rr), nil
	}
}

func wrapRarError(err error) error {
	if errors.Is(err, rardecode.ErrBadPassword) {
		return ErrArchiveEncrypted
	}

	return fmt.Errorf("%w: %w", ErrArchiveCorrupt, err)
}
