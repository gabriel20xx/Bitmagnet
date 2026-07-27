package httpserver

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/bitmagnet-io/bitmagnet/internal/archive"
	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/httpserver"
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"github.com/bitmagnet-io/bitmagnet/internal/mediastream"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// clientClosedRequest is nginx's de facto 499 status for a request whose client disconnected
// before the server responded - net/http has no standard constant for it.
const clientClosedRequest = 499

type Params struct {
	fx.In
	Dao     lazy.Lazy[*dao.Query]
	Service *mediastream.Service
	Logger  *zap.SugaredLogger
}

type Result struct {
	fx.Out
	Option httpserver.Option `group:"http_server_options"`
}

func New(p Params) Result {
	return Result{
		Option: &builder{
			dao:     p.Dao,
			service: p.Service,
			logger:  p.Logger.Named("mediastream"),
		},
	}
}

type builder struct {
	dao     lazy.Lazy[*dao.Query]
	service *mediastream.Service
	logger  *zap.SugaredLogger
}

func (*builder) Key() string {
	return "media_stream"
}

func (b *builder) Apply(e *gin.Engine) error {
	e.GET("/torrents/:infoHash/files/:index/stream", b.handleStream)
	e.GET("/torrents/:infoHash/files/:index/archive/:entryIndex/stream", b.handleArchiveEntryStream)

	return nil
}

func (b *builder) handleStream(ctx *gin.Context) {
	index, t, ok := b.loadTorrentFile(ctx)
	if !ok {
		return
	}

	stream, openErr := b.service.OpenStream(ctx.Request.Context(), t, index)
	if openErr != nil {
		b.writeStreamError(ctx, openErr)

		return
	}
	defer stream.Close()

	http.ServeContent(ctx.Writer, ctx.Request, stream.Name, time.Time{}, stream.Reader)
}

func (b *builder) handleArchiveEntryStream(ctx *gin.Context) {
	index, t, ok := b.loadTorrentFile(ctx)
	if !ok {
		return
	}

	entryIndex, entryIndexErr := strconv.Atoi(ctx.Param("entryIndex"))
	if entryIndexErr != nil || entryIndex < 0 {
		ctx.String(http.StatusBadRequest, "invalid archive entry index")

		return
	}

	stream, openErr := b.service.OpenArchiveEntry(ctx.Request.Context(), t, index, entryIndex)
	if openErr != nil {
		b.writeStreamError(ctx, openErr)

		return
	}
	defer stream.Close()

	http.ServeContent(ctx.Writer, ctx.Request, stream.Name, time.Time{}, stream.Reader)
}

// loadTorrentFile parses and validates the :infoHash/:index route params shared by both
// stream handlers, and loads the corresponding torrent (with the relations OpenStream and
// OpenArchiveEntry both need already preloaded). ok is false if a response has already been
// written and the caller should return immediately.
func (b *builder) loadTorrentFile(ctx *gin.Context) (index uint, t *model.Torrent, ok bool) {
	infoHash, parseErr := protocol.ParseID(ctx.Param("infoHash"))
	if parseErr != nil {
		ctx.String(http.StatusBadRequest, "invalid info hash")

		return 0, nil, false
	}

	index64, indexErr := strconv.ParseUint(ctx.Param("index"), 10, 32)
	if indexErr != nil {
		ctx.String(http.StatusBadRequest, "invalid file index")

		return 0, nil, false
	}

	q, daoErr := b.dao.Get()
	if daoErr != nil {
		b.logger.Errorw("error getting dao", "error", daoErr)
		ctx.Status(http.StatusInternalServerError)

		return 0, nil, false
	}

	t, findErr := q.Torrent.WithContext(ctx).
		Where(q.Torrent.InfoHash.Eq(infoHash)).
		Preload(q.Torrent.Files.RelationField, q.Torrent.Pieces.RelationField).
		First()
	if findErr != nil {
		if errors.Is(findErr, gorm.ErrRecordNotFound) {
			ctx.Status(http.StatusNotFound)

			return 0, nil, false
		}

		b.logger.Errorw("error fetching torrent", "error", findErr)
		ctx.Status(http.StatusInternalServerError)

		return 0, nil, false
	}

	return uint(index64), t, true
}

func (b *builder) writeStreamError(ctx *gin.Context, openErr error) {
	switch {
	case errors.Is(openErr, mediastream.ErrFileNotFound), errors.Is(openErr, archive.ErrEntryNotFound):
		ctx.Status(http.StatusNotFound)
	case errors.Is(openErr, mediastream.ErrFileNotPreviewable), errors.Is(openErr, mediastream.ErrNotAnArchive):
		ctx.Status(http.StatusUnsupportedMediaType)
	case errors.Is(openErr, archive.ErrArchiveEncrypted):
		ctx.Status(http.StatusUnauthorized)
	case errors.Is(openErr, archive.ErrArchiveCorrupt):
		ctx.Status(http.StatusUnprocessableEntity)
	case errors.Is(openErr, mediastream.ErrArchiveEntryTooLarge):
		ctx.Status(http.StatusRequestEntityTooLarge)
	case errors.Is(openErr, mediastream.ErrTooManyStreams):
		ctx.Status(http.StatusServiceUnavailable)
	case errors.Is(openErr, mediastream.ErrMetadataTimeout):
		// Expected when the swarm has no responsive peers within the timeout - not a
		// server malfunction, so this doesn't warrant an error-level log entry.
		ctx.Status(http.StatusGatewayTimeout)
	case errors.Is(openErr, context.Canceled):
		// The client disconnected (a player seeking away, a closed browser tab) before the
		// stream could open - not a server fault, so this doesn't warrant an error-level log
		// entry. There's no standard net/http constant for this; 499 is nginx's convention.
		ctx.Status(clientClosedRequest)
	default:
		b.logger.Errorw("error opening media stream", "error", openErr)
		ctx.Status(http.StatusInternalServerError)
	}
}
