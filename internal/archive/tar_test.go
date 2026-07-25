package archive

import (
	"archive/tar"
	"bytes"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type tarEntrySpec struct {
	name     string
	content  string
	typeflag byte
	linkname string
}

func buildTar(t *testing.T, specs []tarEntrySpec) []byte {
	t.Helper()

	var buf bytes.Buffer

	tw := tar.NewWriter(&buf)

	for _, spec := range specs {
		typeflag := spec.typeflag
		if typeflag == 0 {
			typeflag = tar.TypeReg
		}

		hdr := &tar.Header{
			Name:     spec.name,
			Typeflag: typeflag,
			Linkname: spec.linkname,
			Size:     int64(len(spec.content)),
			Mode:     0o644,
		}

		require.NoError(t, tw.WriteHeader(hdr))

		if typeflag == tar.TypeReg {
			_, err := tw.Write([]byte(spec.content))
			require.NoError(t, err)
		}
	}

	require.NoError(t, tw.Close())

	return buf.Bytes()
}

func openTestTar(t *testing.T, specs []tarEntrySpec) Reader {
	t.Helper()

	data := buildTar(t, specs)

	r, err := Open(FormatTar, bytes.NewReader(data), int64(len(data)))
	require.NoError(t, err)

	return r
}

func TestTarEntriesBasic(t *testing.T) {
	r := openTestTar(t, []tarEntrySpec{
		{name: "readme.txt", content: "hello"},
		{name: "sub/video.mp4", content: "not really a video"},
	})

	entries := r.Entries()
	require.Len(t, entries, 2)

	assert.Equal(t, "readme.txt", entries[0].Path)
	assert.Equal(t, int64(len("hello")), entries[0].Size)
	assert.Equal(t, "sub/video.mp4", entries[1].Path)
	assert.True(t, entries[1].FileType.Valid)
	assert.Equal(t, "video", string(entries[1].FileType.FileType))
}

func TestTarNonRegularEntriesAreExcluded(t *testing.T) {
	r := openTestTar(t, []tarEntrySpec{
		{name: "dir/", typeflag: tar.TypeDir},
		{name: "dir/file.txt", content: "x"},
		{name: "dir/link.txt", typeflag: tar.TypeSymlink, linkname: "dir/file.txt"},
	})

	entries := r.Entries()
	require.Len(t, entries, 1)
	assert.Equal(t, "dir/file.txt", entries[0].Path)
}

func TestTarOpenByIndex(t *testing.T) {
	r := openTestTar(t, []tarEntrySpec{
		{name: "a.txt", content: "first"},
		{name: "b.txt", content: "second"},
	})

	entries := r.Entries()
	require.Len(t, entries, 2)

	rc, err := r.Open(entries[1].Index)
	require.NoError(t, err)

	content, readErr := io.ReadAll(rc)
	require.NoError(t, readErr)
	assert.Equal(t, "second", string(content))
}

func TestTarOpenUnknownIndex(t *testing.T) {
	r := openTestTar(t, []tarEntrySpec{{name: "a.txt", content: "a"}})

	_, err := r.Open(999)
	assert.ErrorIs(t, err, ErrEntryNotFound)
}

func TestTarOpenNonRegularIndex(t *testing.T) {
	r := openTestTar(t, []tarEntrySpec{{name: "dir/", typeflag: tar.TypeDir}})

	// Even though "dir/" was excluded from Entries(), directly requesting its position
	// (rather than a value Entries() ever returned) must still fail safely, not panic.
	_, err := r.Open(0)
	assert.ErrorIs(t, err, ErrEntryNotFound)
}

func TestTarOpenCorruptArchive(t *testing.T) {
	data := []byte("this is not a tar file, and much too long to look like a valid empty tar")

	_, err := scanTarEntries(bytes.NewReader(data))
	assert.ErrorIs(t, err, ErrArchiveCorrupt)
}
