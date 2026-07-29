package auth

import (
	"context"
	"net/http"
)

type httpContextKey struct{}

type HTTPContext struct {
	Request httpRequest
	Writer  http.ResponseWriter
}

type httpRequest interface {
	Cookie(name string) (*http.Cookie, error)
}

func WithHTTPContext(ctx context.Context, request *http.Request, writer http.ResponseWriter) context.Context {
	return context.WithValue(ctx, httpContextKey{}, HTTPContext{Request: request, Writer: writer})
}

func getHTTPContext(ctx context.Context) (HTTPContext, bool) {
	h, ok := ctx.Value(httpContextKey{}).(HTTPContext)
	return h, ok
}
