package archive

import (
	"io"
	"sync"
)

// readerAtAdapter adapts an io.ReadSeeker to io.ReaderAt, so formats that need random
// access (zip, and later 7z) can be parsed against a reader that otherwise only supports
// sequential Seek+Read - such as the piece-fetching readers internal/mediastream hands this
// package. Seek+Read isn't safe for concurrent use, so this serializes all access; every
// read through it also contends for the same underlying piece-fetching connection anyway,
// so this isn't a meaningfully bigger practical cost.
type readerAtAdapter struct {
	mu sync.Mutex
	r  io.ReadSeeker
}

func newReaderAtAdapter(r io.ReadSeeker) *readerAtAdapter {
	return &readerAtAdapter{r: r}
}

func (a *readerAtAdapter) ReadAt(p []byte, off int64) (int, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if _, err := a.r.Seek(off, io.SeekStart); err != nil {
		return 0, err
	}

	// io.ReaderAt requires either a full-buffer read or an error - a bare Read here could
	// silently return short with no error (common for network-backed readers under
	// transient conditions), corrupting whatever's parsing the result.
	return io.ReadFull(a.r, p)
}
