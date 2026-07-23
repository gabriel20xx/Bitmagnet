// Package mediastream serves image/audio/video/text files from inside a torrent for
// in-browser preview, by fetching piece data on demand directly from peers. Unlike the rest
// of bitmagnet, which only ever indexes DHT metadata, this package acts as a real (leech-only)
// BitTorrent client for the specific files being previewed.
package mediastream

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	at "github.com/anacrolix/torrent"
	"github.com/anacrolix/torrent/metainfo"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/torrentfile"
	"go.uber.org/zap"
)

var (
	ErrTooManyStreams     = errors.New("too many concurrent media streams")
	ErrFileNotFound       = errors.New("file not found in torrent")
	ErrFileNotPreviewable = errors.New("file type is not previewable")
)

// Stream is a previewable file's content, ready to be served over HTTP with range support.
type Stream struct {
	Reader   io.ReadSeeker
	Name     string
	Size     int64
	closeFns []func() error
}

func (s *Stream) Close() error {
	var firstErr error
	for _, fn := range s.closeFns {
		if err := fn(); err != nil && firstErr == nil {
			firstErr = err
		}
	}

	return firstErr
}

type Service struct {
	config Config
	logger *zap.SugaredLogger
	client *at.Client

	mu               sync.Mutex
	totalActive      int
	activePerTorrent map[string]int
	lastAccess       map[string]time.Time

	done chan struct{}
}

func New(config Config, logger *zap.SugaredLogger) (*Service, error) {
	if mkdirErr := os.MkdirAll(config.DataDir, 0o755); mkdirErr != nil {
		return nil, fmt.Errorf("creating media stream data dir: %w", mkdirErr)
	}

	clientConfig := at.NewDefaultClientConfig()
	clientConfig.DataDir = config.DataDir
	clientConfig.NoUpload = true
	clientConfig.Seed = false

	client, clientErr := at.NewClient(clientConfig)
	if clientErr != nil {
		return nil, fmt.Errorf("creating torrent client: %w", clientErr)
	}

	s := &Service{
		config:           config,
		logger:           logger,
		client:           client,
		activePerTorrent: make(map[string]int),
		lastAccess:       make(map[string]time.Time),
		done:             make(chan struct{}),
	}

	go s.evictIdleLoop()

	return s, nil
}

func (s *Service) Close() error {
	close(s.done)
	s.client.Close()

	return nil
}

// OpenStream resolves the file at index within t, and returns a Stream that fetches its
// data on demand from peers. Callers must Close the returned Stream once done reading it.
func (s *Service) OpenStream(ctx context.Context, t *model.Torrent, index uint) (*Stream, error) {
	name, size, fileType, resolveErr := resolveFile(t, index)
	if resolveErr != nil {
		return nil, resolveErr
	}

	if !isPreviewable(fileType) && !isTextFile(name) {
		return nil, ErrFileNotPreviewable
	}

	key := t.InfoHash.String()

	if acquireErr := s.acquireSlot(key); acquireErr != nil {
		return nil, acquireErr
	}

	tt, addErr := s.getOrAddTorrent(t)
	if addErr != nil {
		s.releaseSlot(key)

		return nil, addErr
	}

	select {
	case <-tt.GotInfo():
	case <-ctx.Done():
		s.releaseSlot(key)

		return nil, ctx.Err()
	case <-time.After(30 * time.Second):
		s.releaseSlot(key)

		return nil, errors.New("timed out waiting for torrent info")
	}

	files := tt.Files()
	if int(index) >= len(files) {
		s.releaseSlot(key)

		return nil, ErrFileNotFound
	}

	file := files[index]
	reader := file.NewReader()
	reader.SetContext(ctx)
	reader.SetResponsive()
	reader.SetReadahead(s.config.ReadaheadBytes)

	return &Stream{
		Reader: reader,
		Name:   name,
		Size:   size,
		closeFns: []func() error{
			reader.Close,
			func() error {
				s.releaseSlot(key)

				return nil
			},
		},
	}, nil
}

// getOrAddTorrent hands the torrent to the client so it can fetch piece data from peers.
// When we already have piece hashes on file (the common case), it reconstructs the full
// .torrent metadata locally, which lets the client start verifying and downloading pieces
// immediately. Otherwise (e.g. piece saving was disabled at crawl time), it falls back to
// adding the torrent by info hash alone, exactly like a magnet link: the client fetches the
// info dict - including piece hashes - live from peers over the BEP-9 metadata extension.
func (s *Service) getOrAddTorrent(t *model.Torrent) (*at.Torrent, error) {
	fileBytes, buildErr := torrentfile.Build(t)
	if buildErr != nil {
		if !errors.Is(buildErr, torrentfile.ErrDataUnavailable) {
			return nil, buildErr
		}

		tt, _ := s.client.AddTorrentInfoHash(metainfo.Hash(t.InfoHash))

		return tt, nil
	}

	mi, loadErr := metainfo.Load(bytes.NewReader(fileBytes))
	if loadErr != nil {
		return nil, loadErr
	}

	tt, addErr := s.client.AddTorrent(mi)
	if addErr != nil {
		return nil, addErr
	}

	return tt, nil
}

func (s *Service) acquireSlot(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.totalActive >= int(s.config.MaxConcurrentStreams) {
		return ErrTooManyStreams
	}

	s.totalActive++
	s.activePerTorrent[key]++
	s.lastAccess[key] = time.Now()

	return nil
}

func (s *Service) releaseSlot(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.totalActive--
	s.activePerTorrent[key]--

	if s.activePerTorrent[key] <= 0 {
		delete(s.activePerTorrent, key)
	}

	s.lastAccess[key] = time.Now()
}

func (s *Service) evictIdleLoop() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.done:
			return
		case <-ticker.C:
			s.evictIdle()
		}
	}
}

func (s *Service) evictIdle() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()

	for _, tt := range s.client.Torrents() {
		key := tt.InfoHash().String()

		if s.activePerTorrent[key] > 0 {
			continue
		}

		last, ok := s.lastAccess[key]
		if ok && now.Sub(last) > s.config.IdleTimeout {
			delete(s.lastAccess, key)
			tt.Drop()
		}
	}
}

func resolveFile(t *model.Torrent, index uint) (name string, size int64, fileType model.NullFileType, err error) {
	if t.SingleFile() {
		if index != 0 {
			return "", 0, model.NullFileType{}, ErrFileNotFound
		}

		return t.Name, int64(t.Size), t.FileType(), nil
	}

	for i := range t.Files {
		if t.Files[i].Index == index {
			return pathBaseName(t.Files[i].Path), int64(t.Files[i].Size), t.Files[i].FileType(), nil
		}
	}

	return "", 0, model.NullFileType{}, ErrFileNotFound
}

// pathBaseName returns the last '/'-separated segment of path, extension included.
func pathBaseName(path string) string {
	parts := strings.Split(path, "/")
	for i := len(parts) - 1; i >= 0; i-- {
		if parts[i] != "" {
			return parts[i]
		}
	}

	return path
}

func isPreviewable(ft model.NullFileType) bool {
	if !ft.Valid {
		return false
	}

	switch ft.FileType {
	case model.FileTypeImage, model.FileTypeAudio, model.FileTypeVideo:
		return true
	default:
		return false
	}
}

// textFileExtensions are the subset of model.FileTypeDocument/model.FileTypeSubtitles
// extensions that are actually plain text - as opposed to e.g. pdf/epub/docx, which share
// the "document" bucket but can't be rendered as raw text.
var textFileExtensions = map[string]bool{
	".txt": true,
	".nfo": true,
	".md":  true,
	".log": true,
	".srt": true,
	".vtt": true,
	".sub": true,
}

func isTextFile(name string) bool {
	return textFileExtensions[strings.ToLower(filepath.Ext(name))]
}
