package archive

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type zipEntrySpec struct {
	name    string
	content string
	flags   uint16
}

func buildZip(t *testing.T, specs []zipEntrySpec) []byte {
	t.Helper()

	var buf bytes.Buffer

	zw := zip.NewWriter(&buf)

	for _, spec := range specs {
		hdr := &zip.FileHeader{Name: spec.name, Method: zip.Deflate, Flags: spec.flags}

		w, err := zw.CreateHeader(hdr)
		require.NoError(t, err)

		_, err = w.Write([]byte(spec.content))
		require.NoError(t, err)
	}

	require.NoError(t, zw.Close())

	return buf.Bytes()
}

func openTestZip(t *testing.T, specs []zipEntrySpec) Reader {
	t.Helper()

	data := buildZip(t, specs)

	r, err := Open(FormatZip, bytes.NewReader(data), int64(len(data)))
	require.NoError(t, err)

	return r
}

func TestZipEntriesBasic(t *testing.T) {
	r := openTestZip(t, []zipEntrySpec{
		{name: "readme.txt", content: "hello"},
		{name: "sub/dir/video.mp4", content: "not really a video"},
	})

	entries := r.Entries()
	require.Len(t, entries, 2)

	assert.Equal(t, "readme.txt", entries[0].Path)
	assert.Equal(t, int64(len("hello")), entries[0].Size)
	assert.True(t, entries[0].FileType.Valid)
	assert.Equal(t, "document", string(entries[0].FileType.FileType))

	assert.Equal(t, "sub/dir/video.mp4", entries[1].Path)
	assert.True(t, entries[1].FileType.Valid)
	assert.Equal(t, "video", string(entries[1].FileType.FileType))
}

func TestZipDirectoryEntriesAreExcluded(t *testing.T) {
	r := openTestZip(t, []zipEntrySpec{
		{name: "dir/", content: ""},
		{name: "dir/file.txt", content: "x"},
	})

	entries := r.Entries()
	require.Len(t, entries, 1)
	assert.Equal(t, "dir/file.txt", entries[0].Path)
}

func TestZipDuplicateNamesAddressedByIndex(t *testing.T) {
	r := openTestZip(t, []zipEntrySpec{
		{name: "dup.txt", content: "first"},
		{name: "dup.txt", content: "second"},
	})

	entries := r.Entries()
	require.Len(t, entries, 2)
	assert.NotEqual(t, entries[0].Index, entries[1].Index)

	rc0, err := r.Open(entries[0].Index)
	require.NoError(t, err)

	b0, err := io.ReadAll(rc0)
	require.NoError(t, err)
	require.NoError(t, rc0.Close())
	assert.Equal(t, "first", string(b0))

	rc1, err := r.Open(entries[1].Index)
	require.NoError(t, err)

	b1, err := io.ReadAll(rc1)
	require.NoError(t, err)
	require.NoError(t, rc1.Close())
	assert.Equal(t, "second", string(b1))
}

func TestZipOpenUnknownIndex(t *testing.T) {
	r := openTestZip(t, []zipEntrySpec{{name: "a.txt", content: "a"}})

	_, err := r.Open(999)
	assert.ErrorIs(t, err, ErrEntryNotFound)
}

func TestZipOpenEncryptedEntry(t *testing.T) {
	r := openTestZip(t, []zipEntrySpec{{name: "secret.txt", content: "s", flags: zipEncryptedFlag}})

	entries := r.Entries()
	require.Len(t, entries, 1)

	_, err := r.Open(entries[0].Index)
	assert.ErrorIs(t, err, ErrArchiveEncrypted)
}

func TestZipOpenCorruptArchive(t *testing.T) {
	data := []byte("this is not a zip file")

	_, err := Open(FormatZip, bytes.NewReader(data), int64(len(data)))
	assert.ErrorIs(t, err, ErrArchiveCorrupt)
}

func TestDetectFormat(t *testing.T) {
	cases := []struct {
		name       string
		wantFormat Format
		wantOK     bool
	}{
		{"movie.zip", FormatZip, true},
		{"Movie.ZIP", FormatZip, true},
		{"disk.iso", "", false}, // ISO9660 filesystem image, not a compressed archive - never dispatched
		{"archive.rar", FormatRar, true},
		{"archive.7z", FormatSevenZ, true},
		{"archive.tar", FormatTar, true},
		{"archive.tar.gz", "", false}, // ambiguous with a standalone .gz - not dispatched, see DetectFormat doc
		{"archive.gz", "", false},
		{"archive.bz2", "", false},
		{"noext", "", false},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			format, ok := DetectFormat(c.name)
			assert.Equal(t, c.wantOK, ok)
			assert.Equal(t, c.wantFormat, format)
		})
	}
}

func TestReaderAtAdapterFullRead(t *testing.T) {
	data := []byte("0123456789abcdef")
	adapter := newReaderAtAdapter(bytes.NewReader(data))

	buf := make([]byte, 5)
	n, err := adapter.ReadAt(buf, 3)
	require.NoError(t, err)
	assert.Equal(t, 5, n)
	assert.Equal(t, "34567", string(buf))

	// Reading again from an earlier offset must not be affected by the previous read's
	// position - this is the whole point of the adapter (Seek+Read is not naturally
	// idempotent/random-access without it).
	n, err = adapter.ReadAt(buf, 0)
	require.NoError(t, err)
	assert.Equal(t, 5, n)
	assert.Equal(t, "01234", string(buf))
}

func TestReaderAtAdapterShortReadIsAnError(t *testing.T) {
	data := []byte("short")
	adapter := newReaderAtAdapter(bytes.NewReader(data))

	buf := make([]byte, 10)
	_, err := adapter.ReadAt(buf, 0)
	assert.True(t, errors.Is(err, io.ErrUnexpectedEOF) || errors.Is(err, io.EOF))
}
