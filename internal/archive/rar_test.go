package archive

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
)

// nwaples/rardecode has no writer (RAR is a proprietary format with no freely available
// encoder, unlike zip/tar which are testable with stdlib writers, or 7z which is testable
// against a fixture built with the real p7zip CLI) - there is no way to construct a genuine
// RAR fixture in this environment, so round-tripping real archive bytes through
// openRar/Open isn't covered by an automated test here. What IS covered: the error-mapping
// path (exercised for real against rardecode's actual "not a RAR file" detection, which
// needs no valid archive to trigger) and the static format classification.
func TestRarOpenCorruptArchive(t *testing.T) {
	data := []byte("this is not a rar file")

	_, err := Open(FormatRar, bytes.NewReader(data), int64(len(data)))
	assert.ErrorIs(t, err, ErrArchiveCorrupt)
}

func TestRarIsSequential(t *testing.T) {
	assert.True(t, FormatRar.IsSequential())
}

func TestTarIsSequential(t *testing.T) {
	assert.True(t, FormatTar.IsSequential())
}

func TestZipAndSevenZipAreNotSequential(t *testing.T) {
	assert.False(t, FormatZip.IsSequential())
	assert.False(t, FormatSevenZ.IsSequential())
}
