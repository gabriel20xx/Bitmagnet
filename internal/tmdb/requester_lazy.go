package tmdb

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/bitmagnet-io/bitmagnet/internal/concurrency"
	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"github.com/bitmagnet-io/bitmagnet/internal/settings"
	"github.com/go-resty/resty/v2"
	"go.uber.org/zap"
	"golang.org/x/sync/semaphore"
	"golang.org/x/time/rate"
)

// requesterLazy defers instantiation of the requester (and possible failure) until the first
// request is made, avoiding failure when the TMDB client is not needed. Every (re)build resolves
// the API key from the admin-configured internal/settings value (falling back to the env/file
// configured one), so calling Invalidate rebuilds the underlying HTTP client with whatever key is
// currently stored - applying an admin-configured key change immediately, with no restart needed.
type requesterLazy struct {
	mu              sync.Mutex
	built           bool
	config          Config
	settingsManager lazy.Lazy[settings.Manager]
	logger          *zap.SugaredLogger
	err             error
	requester       Requester
}

func (r *requesterLazy) Request(
	ctx context.Context,
	path string,
	queryParams map[string]string,
	result interface{},
) (*resty.Response, error) {
	r.mu.Lock()
	if !r.built {
		config, cfgErr := r.resolveConfig(ctx)
		if cfgErr != nil {
			r.requester, r.err = nil, cfgErr
		} else {
			r.requester, r.err = newRequester(ctx, config, r.logger)
		}
		r.built = true
	}
	requester, err := r.requester, r.err
	r.mu.Unlock()

	if err != nil {
		return nil, err
	}

	return requester.Request(ctx, path, queryParams, result)
}

// Invalidate forces the next Request to rebuild the underlying HTTP client from the
// currently-configured API key.
func (r *requesterLazy) Invalidate() {
	r.mu.Lock()
	r.built = false
	r.requester, r.err = nil, nil
	r.mu.Unlock()
}

func (r *requesterLazy) resolveConfig(ctx context.Context) (Config, error) {
	config := r.config

	sm, err := r.settingsManager.Get()
	if err != nil {
		return config, err
	}

	apiKey, ok, err := sm.Get(ctx, APIKeySettingsKey)
	if err != nil {
		return config, err
	}

	if ok && apiKey != "" {
		config.APIKey = apiKey
	}

	return config, nil
}

func newRequester(ctx context.Context, config Config, logger *zap.SugaredLogger) (Requester, error) {
	if !config.Enabled {
		return nil, errors.New("TMDB is disabled")
	}

	if config.APIKey == defaultTmdbAPIKey {
		logger.Warnln(
			"you are using the default TMDB api key; TMDB requests will be limited to 1 per second; " +
				"to remove this warning please configure a personal TMDB api key",
		)

		config.RateLimit = time.Second
		config.RateLimitBurst = 8
	}

	r := requesterLogger{
		requester: requesterFailFast{
			requester: requesterSemaphore{
				requester: requesterLimiter{
					requester: requester{
						resty: resty.New().
							SetBaseURL(config.BaseURL).
							SetQueryParam("api_key", config.APIKey).
							SetRetryCount(3).
							SetRetryWaitTime(2 * time.Second).
							SetRetryMaxWaitTime(20 * time.Second).
							SetTimeout(10 * time.Second).
							EnableTrace().
							SetLogger(logger),
					},
					limiter: rate.NewLimiter(rate.Every(config.RateLimit), config.RateLimitBurst),
				},
				semaphore: semaphore.NewWeighted(2),
			},
			isUnauthorized: &concurrency.AtomicValue[bool]{},
		},
		logger: logger,
	}

	err := client{requester: r}.ValidateAPIKey(ctx)
	if errors.Is(err, ErrUnauthorized) {
		if config.APIKey == defaultTmdbAPIKey {
			return r, fmt.Errorf("default api key is invalid: %w", err)
		}

		logger.Errorw("invalid api key, falling back to default", "error", err)

		config.APIKey = defaultTmdbAPIKey

		return newRequester(ctx, config, logger)
	}

	return r, err
}
