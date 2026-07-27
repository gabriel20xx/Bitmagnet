package logger

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"go.uber.org/fx"
	"go.uber.org/zap"
	gormlogger "gorm.io/gorm/logger"
	"gorm.io/gorm/utils"
)

// maxSQLLogLength caps how much of the interpolated SQL (parameter values included) gets
// logged - queries like the DHT crawler's info-hash triage embed up to ~1000 raw hash values,
// which otherwise dumps kilobytes of near-unreadable text per log line.
const maxSQLLogLength = 500

// sanitizeSQL keeps a gorm trace line to a single short, readable physical log line. gorm's own
// ExplainSQL only masks a []byte parameter as "<binary>" if it fails a UTF-8 validity check, but
// raw info-hash bytes occasionally pass that check by coincidence while still containing control
// characters or the replacement rune - which renders as mojibake and, for literal \n/\r, would
// otherwise split one log entry across multiple physical lines. Collapsing every such run to a
// single "<binary>" marker (matching gorm's own convention) and capping the overall length keeps
// every trace to one glanceable line regardless of what a query happened to embed.
func sanitizeSQL(sql string) string {
	total := utf8.RuneCountInString(sql)

	var b strings.Builder

	inBadRun := false
	for _, r := range sql {
		if r == utf8.RuneError || unicode.IsControl(r) {
			if !inBadRun {
				b.WriteString("<binary>")
				inBadRun = true
			}

			continue
		}

		inBadRun = false
		b.WriteRune(r)
	}

	sanitized := []rune(b.String())
	if len(sanitized) <= maxSQLLogLength {
		return string(sanitized)
	}

	return string(sanitized[:maxSQLLogLength]) + fmt.Sprintf("... [truncated, %d chars total]", total)
}

type Config struct {
	SlowThreshold time.Duration
	LogLevel      gormlogger.LogLevel
}

type Params struct {
	fx.In
	Config    Config
	ZapLogger *zap.SugaredLogger
}

type Result struct {
	fx.Out
	GormLogger gormlogger.Interface
}

func New(p Params) Result {
	return Result{
		GormLogger: &customLogger{
			logLevel:      p.Config.LogLevel,
			slowThreshold: p.Config.SlowThreshold,
			zap:           p.ZapLogger.Named("gorm"),
		},
	}
}

type customLogger struct {
	logLevel      gormlogger.LogLevel
	slowThreshold time.Duration
	zap           *zap.SugaredLogger
}

func (l *customLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	newlogger := *l
	newlogger.logLevel = level

	return l
}

func (l *customLogger) Info(_ context.Context, msg string, data ...interface{}) {
	l.zap.Debugw("gorm", "msg", msg, "data", data)
}

func (l *customLogger) Warn(_ context.Context, msg string, data ...interface{}) {
	l.zap.Warnw("gorm", "msg", msg, "data", data)
}

func (l *customLogger) Error(_ context.Context, msg string, data ...interface{}) {
	l.zap.Errorw("gorm", "msg", msg, "data", data)
}

func (l *customLogger) Trace(_ context.Context, begin time.Time, fc func() (string, int64), err error) {
	if l.logLevel <= gormlogger.Silent {
		return
	}

	elapsed := time.Since(begin)

	switch {
	case err != nil && l.logLevel >= gormlogger.Error &&
		!errors.Is(err, gormlogger.ErrRecordNotFound) &&
		!errors.Is(err, context.Canceled):
		sql, rows := fc()
		l.zap.Errorw("gorm trace",
			"location", utils.FileWithLineNum(),
			"error", err,
			"elapsed", float64(elapsed.Nanoseconds())/1e6,
			"sql", sanitizeSQL(sql),
			"rows", rows)
	case elapsed > l.slowThreshold && l.slowThreshold != 0 && l.logLevel >= gormlogger.Warn:
		sql, rows := fc()
		slowLog := fmt.Sprintf("SLOW SQL >= %v", l.slowThreshold)
		l.zap.Warnw("gorm trace",
			"location", utils.FileWithLineNum(),
			"slowLog", slowLog,
			"elapsed", float64(elapsed.Nanoseconds())/1e6,
			"sql", sanitizeSQL(sql),
			"rows", rows)
	case l.logLevel == gormlogger.Info:
		sql, rows := fc()
		l.zap.Debugw("gorm trace",
			"location", utils.FileWithLineNum(),
			"elapsed", float64(elapsed.Nanoseconds())/1e6,
			"sql", sanitizeSQL(sql),
			"rows", rows)
	}
}
