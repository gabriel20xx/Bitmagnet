// Package torrentfile reconstructs a trackerless (DHT-only) .torrent file from the
// name/size/files/piece-hashes already persisted for a crawled torrent, so it can be
// served for download without bitmagnet ever having stored the original raw .torrent bytes.
package torrentfile

import (
	"bytes"
	"errors"
	"sort"
	"strings"

	"github.com/anacrolix/torrent/bencode"
	"github.com/anacrolix/torrent/metainfo"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

// ErrDataUnavailable is returned when the torrent's files or piece hashes were not
// persisted at crawl time (e.g. FilesStatus is over_threshold/no_info, or piece saving
// was disabled), so a valid .torrent file cannot be reconstructed.
var ErrDataUnavailable = errors.New("torrent file data is not available for this torrent")

func Build(t *model.Torrent) ([]byte, error) {
	if len(t.Pieces.Pieces) == 0 || t.Pieces.PieceLength == 0 {
		return nil, ErrDataUnavailable
	}

	if t.FilesStatus != model.FilesStatusSingle && t.FilesStatus != model.FilesStatusMulti {
		return nil, ErrDataUnavailable
	}

	private := t.Private
	info := metainfo.Info{
		Name:        t.Name,
		PieceLength: t.Pieces.PieceLength,
		Pieces:      t.Pieces.Pieces,
		Private:     &private,
	}

	if t.FilesStatus == model.FilesStatusSingle {
		info.Length = int64(t.Size)
	} else {
		files := make([]model.TorrentFile, len(t.Files))
		copy(files, t.Files)
		sort.Slice(files, func(i, j int) bool { return files[i].Index < files[j].Index })

		info.Files = make([]metainfo.FileInfo, len(files))
		for i, f := range files {
			info.Files[i] = metainfo.FileInfo{
				Length: int64(f.Size),
				Path:   strings.Split(f.Path, "/"),
			}
		}
	}

	infoBytes, marshalErr := bencode.Marshal(info)
	if marshalErr != nil {
		return nil, marshalErr
	}

	mi := metainfo.MetaInfo{InfoBytes: infoBytes}

	var buf bytes.Buffer
	if writeErr := mi.Write(&buf); writeErr != nil {
		return nil, writeErr
	}

	return buf.Bytes(), nil
}
