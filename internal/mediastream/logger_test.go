package mediastream

import (
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
