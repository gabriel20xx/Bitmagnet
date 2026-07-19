// Package webuireact runs the new React web UI on its own port, independently of
// the primary http_server (which continues to serve the existing Angular UI at
// /webui). This lets both UIs be compared side by side against the same backend
// while the React rewrite is evaluated, without touching the existing wiring.
package webuireact

import (
	"context"
	"errors"
	"io/fs"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/bitmagnet-io/bitmagnet/internal/httpserver"
	"github.com/bitmagnet-io/bitmagnet/internal/worker"
	webuireactdist "github.com/bitmagnet-io/bitmagnet/webui-react"
	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Params struct {
	fx.In
	Config    Config
	APIConfig httpserver.Config
	Logger    *zap.SugaredLogger
}

// apiURL resolves the primary http_server's address (which serves the GraphQL
// API the embedded, production-built React app expects to find on its own
// origin) into a URL the reverse proxy below can dial.
func apiURL(localAddress string) (*url.URL, error) {
	addr := localAddress
	if strings.HasPrefix(addr, ":") {
		addr = "localhost" + addr
	}

	return url.Parse("http://" + addr)
}

type Result struct {
	fx.Out
	Worker worker.Worker `group:"workers"`
}

func New(p Params) Result {
	logger := p.Logger.Named("webui_react")

	var s *http.Server

	return Result{
		Worker: worker.NewWorker(
			"webui_react_server",
			fx.Hook{
				OnStart: func(ctx context.Context) error {
					appRoot, appRootErr := fs.Sub(webuireactdist.StaticFS(), "dist")
					if appRootErr != nil {
						logger.Errorf(
							"webui-react dist directory is missing; run `npm run build` in `webui-react`: %v",
							appRootErr,
						)

						return nil
					}

					target, targetErr := apiURL(p.APIConfig.LocalAddress)
					if targetErr != nil {
						return targetErr
					}

					proxy := httputil.NewSingleHostReverseProxy(target)

					gin.SetMode(p.Config.GinMode)
					g := gin.New()
					g.Use(gin.Recovery())
					g.StaticFS("/webui", wrappedFs{http.FS(appRoot)})
					// The embedded React build resolves its GraphQL endpoint from its own
					// origin, so /graphql is proxied through to the main http_server, which
					// is the only one actually running the GraphQL API.
					g.Any("/graphql", gin.WrapH(proxy))
					g.GET("/", func(c *gin.Context) {
						c.Redirect(http.StatusMovedPermanently, "/webui")
					})

					s = &http.Server{
						Addr:    p.Config.LocalAddress,
						Handler: g.Handler(),
					}

					ln, listenErr := (&net.ListenConfig{}).Listen(ctx, "tcp", s.Addr)
					if listenErr != nil {
						return listenErr
					}

					go func() {
						serveErr := s.Serve(ln)
						if !errors.Is(serveErr, http.ErrServerClosed) {
							panic(serveErr)
						}
					}()

					logger.Infof("webui-react listening on %s", p.Config.LocalAddress)

					return nil
				},
				OnStop: func(ctx context.Context) error {
					if s == nil {
						return nil
					}

					return s.Shutdown(ctx)
				},
			},
		),
	}
}

type wrappedFs struct {
	http.FileSystem
}

func (w wrappedFs) Open(name string) (http.File, error) {
	f, err := w.FileSystem.Open(name)
	if err != nil && errors.Is(err, fs.ErrNotExist) {
		return w.FileSystem.Open("/index.html")
	}

	return f, err
}
