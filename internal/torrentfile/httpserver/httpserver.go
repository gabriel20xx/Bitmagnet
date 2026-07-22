package httpserver

import (
	"errors"
	"net/http"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/httpserver"
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
	"github.com/bitmagnet-io/bitmagnet/internal/torrentfile"
	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type Params struct {
	fx.In
	Dao    lazy.Lazy[*dao.Query]
	Logger *zap.SugaredLogger
}

type Result struct {
	fx.Out
	Option httpserver.Option `group:"http_server_options"`
}

func New(p Params) Result {
	return Result{
		Option: &builder{
			dao:    p.Dao,
			logger: p.Logger.Named("torrentfile"),
		},
	}
}

type builder struct {
	dao    lazy.Lazy[*dao.Query]
	logger *zap.SugaredLogger
}

func (*builder) Key() string {
	return "torrents"
}

func (b *builder) Apply(e *gin.Engine) error {
	e.GET("/torrents/:infoHash/download", b.handleDownload)

	return nil
}

func (b *builder) handleDownload(ctx *gin.Context) {
	infoHash, parseErr := protocol.ParseID(ctx.Param("infoHash"))
	if parseErr != nil {
		ctx.String(http.StatusBadRequest, "invalid info hash")

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

	fileBytes, buildErr := torrentfile.Build(t)
	if buildErr != nil {
		ctx.String(http.StatusConflict, buildErr.Error())

		return
	}

	ctx.Header("Content-Disposition", `attachment; filename="`+infoHash.String()+`.torrent"`)
	ctx.Data(http.StatusOK, "application/x-bittorrent", fileBytes)
}
