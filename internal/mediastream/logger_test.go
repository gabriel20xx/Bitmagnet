package mediastream

import (
	"context"
	"errors"
	"testing"

	"github.com/anacrolix/log"
	"github.com/stretchr/testify/assert"
)

type recordingHandler struct {
	handled []log.Record
}

func (h *recordingHandler) Handle(r log.Record) {
	h.handled = append(h.handled, r)
}

func TestFilteringLogHandler(t *testing.T) {
	cases := []struct {
		name    string
		record  log.Record
		forward bool
	}{
		{
			name:    "error containing context canceled is dropped",
			record:  log.Record{Msg: log.Str(`msg="initial read failed" err="context canceled"`), Level: log.Error},
			forward: false,
		},
		{
			name:    "error not about cancellation is forwarded",
			record:  log.Record{Msg: log.Str(`msg="initial read failed" err="disk full"`), Level: log.Error},
			forward: true,
		},
		{
			name:    "non-error level containing context canceled is forwarded",
			record:  log.Record{Msg: log.Str("context canceled"), Level: log.Warning},
			forward: true,
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			inner := &recordingHandler{}
			h := filteringLogHandler{next: inner}

			h.Handle(c.record)

			assert.Equal(t, c.forward, len(inner.handled) == 1)
		})
	}
}

// anacrolix/torrent's reader actually logs cancellation via slog (e.g.
// r.slogger().Error("initial read failed", "err", err)), which attaches the error as a structured
// attribute rather than folding it into the message text - reproduce that shape here via the real
// slog bridge (Logger.Slogger()) rather than log.Str, since a hand-built Msg string (as used above)
// doesn't exercise the code path that actually breaks.
func TestFilteringLogHandlerSlogAttrs(t *testing.T) {
	cases := []struct {
		name    string
		err     error
		forward bool
	}{
		{"context canceled err attr is dropped", context.Canceled, false},
		{"err attr merely mentioning the text 'context canceled' is forwarded", errors.New("read: " + context.Canceled.Error()), true},
		{"other err attr is forwarded", errors.New("disk full"), true},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			inner := &recordingHandler{}
			l := log.NewLogger("mediastream-test")
			l.SetHandlers(filteringLogHandler{next: inner})

			l.Slogger().Error("initial read failed", "err", c.err)

			assert.Equal(t, c.forward, len(inner.handled) == 1)
		})
	}
}

func TestClientLoggerFiltersDebugLevel(t *testing.T) {
	inner := &recordingHandler{}
	l := log.NewLogger("mediastream").WithFilterLevel(log.Info)
	l.SetHandlers(inner)

	// anacrolix/torrent derives the DHT server's logger via WithNames("dht", addr) - the filter
	// level must survive that derivation for it to actually silence the DHT's per-query debug spam.
	dhtLogger := l.WithNames("dht", "0.0.0.0:42069")

	dhtLogger.Levelf(log.Debug, "Query(find_node) returned after 2s")
	assert.Empty(t, inner.handled, "debug-level messages should be filtered out")

	dhtLogger.Levelf(log.Warning, "something worth seeing")
	assert.Len(t, inner.handled, 1, "warning-level messages should still be forwarded")
}
