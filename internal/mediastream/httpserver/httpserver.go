package httpserver

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/httpserver"
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"github.com/bitmagnet-io/bitmagnet/internal/mediastream"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
	"github.com/bitmagnet-io/bitmagnet/internal/torrentfile"
	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

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

	return nil
}

func (b *builder) handleStream(ctx *gin.Context) {
	infoHash, parseErr := protocol.ParseID(ctx.Param("infoHash"))
	if parseErr != nil {
		ctx.String(http.StatusBadRequest, "invalid info hash")

		return
	}

	index, indexErr := strconv.ParseUint(ctx.Param("index"), 10, 32)
	if indexErr != nil {
		ctx.String(http.StatusBadRequest, "invalid file index")

		return
	}

	q, daoErr := b.dao.Get()
	if daoErr != nil {
		b.logger.Errorw("error getting dao", "error", daoErr)
		ctx.Status(http.StatusInternalServerError)

		return
	}

	t, findErr := q.Torrent.WithContext(ctx).
		Where(q.Torrent.InfoHash.Eq(infoHash)).
		Preload(q.Torrent.Files.RelationField, q.Torrent.Pieces.RelationField).
		First()
	if findErr != nil {
		if errors.Is(findErr, gorm.ErrRecordNotFound) {
			ctx.Status(http.StatusNotFound)

			return
		}

		b.logger.Errorw("error fetching torrent", "error", findErr)
		ctx.Status(http.StatusInternalServerError)

		return
	}

	stream, openErr := b.service.OpenStream(ctx.Request.Context(), t, uint(index))
	if openErr != nil {
		switch {
		case errors.Is(openErr, mediastream.ErrFileNotFound):
			ctx.Status(http.StatusNotFound)
		case errors.Is(openErr, mediastream.ErrFileNotPreviewable):
			ctx.Status(http.StatusUnsupportedMediaType)
		case errors.Is(openErr, mediastream.ErrTooManyStreams):
			ctx.Status(http.StatusServiceUnavailable)
		case errors.Is(openErr, torrentfile.ErrDataUnavailable):
			ctx.String(http.StatusConflict, openErr.Error())
		default:
			b.logger.Errorw("error opening media stream", "error", openErr)
			ctx.Status(http.StatusInternalServerError)
		}

		return
	}
	defer stream.Close()

	http.ServeContent(ctx.Writer, ctx.Request, stream.Name, time.Time{}, stream.Reader)
}
