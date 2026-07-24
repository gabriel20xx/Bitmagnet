package mediastream

import (
	"strings"

	"github.com/anacrolix/log"
)

// A canceled read is the normal outcome of a media player seeking or the browser closing the
// preview - not a fault in bitmagnet or the swarm - but anacrolix/torrent's reader logs it as an
// Error regardless (its own reader.go acknowledges this with a "TODO: filter errors and set log
// levels appropriately"). This drops just that noise while leaving every other message as-is.
const cancellationNoise = "context canceled"

type filteringLogHandler struct {
	next log.Handler
}

func (h filteringLogHandler) Handle(r log.Record) {
	if r.Level == log.Error && strings.Contains(r.String(), cancellationNoise) {
		return
	}

	h.next.Handle(r)
}

func newClientLogger() log.Logger {
	l := log.NewLogger("mediastream")
	l.SetHandlers(filteringLogHandler{next: log.DefaultHandler})

	return l
}
