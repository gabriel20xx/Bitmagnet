package archive

import (
	"bytes"
	"io"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// testdata/sample.7z contains readme.txt ("hello from readme") and sub/video.mp4 ("not
// really a video but good enough"), built with the real p7zip CLI (bodgit/sevenzip has no
// writer, so there's no way to construct a fixture purely in Go, unlike zip/tar).
func openTestSevenZip(t *testing.T) Reader {
	t.Helper()

	data, err := os.ReadFile("testdata/sample.7z")
	require.NoError(t, err)

	r, openErr := Open(FormatSevenZ, bytes.NewReader(data), int64(len(data)))
	require.NoError(t, openErr)

	return r
}

func TestSevenZipEntries(t *testing.T) {
	r := openTestSevenZip(t)

	entries := r.Entries()
	require.Len(t, entries, 2)

	byPath := make(map[string]Entry, len(entries))
	for _, e := range entries {
		byPath[e.Path] = e
	}

	readme, ok := byPath["readme.txt"]
	require.True(t, ok)
	assert.Equal(t, int64(len("hello from readme")), readme.Size)
	assert.True(t, readme.FileType.Valid)
	assert.Equal(t, "document", string(readme.FileType.FileType))

	video, ok := byPath["sub/video.mp4"]
	require.True(t, ok)
	assert.True(t, video.FileType.Valid)
	assert.Equal(t, "video", string(video.FileType.FileType))
}

func TestSevenZipOpenByIndex(t *testing.T) {
	r := openTestSevenZip(t)

	entries := r.Entries()
	var readmeIndex int

	for _, e := range entries {
		if e.Path == "readme.txt" {
			readmeIndex = e.Index
		}
	}

	rc, err := r.Open(readmeIndex)
	require.NoError(t, err)
	defer rc.Close()

	content, readErr := io.ReadAll(rc)
	require.NoError(t, readErr)
	assert.Equal(t, "hello from readme", string(content))
}

func TestSevenZipOpenUnknownIndex(t *testing.T) {
	r := openTestSevenZip(t)

	_, err := r.Open(999)
	assert.ErrorIs(t, err, ErrEntryNotFound)
}

func TestSevenZipOpenCorruptArchive(t *testing.T) {
	data := []byte("this is not a 7z file")

	_, err := Open(FormatSevenZ, bytes.NewReader(data), int64(len(data)))
	assert.ErrorIs(t, err, ErrArchiveCorrupt)
}
