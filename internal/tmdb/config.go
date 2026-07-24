package tmdb

import "time"

type Config struct {
	Enabled        bool
	BaseURL        string
	APIKey         string
	RateLimit      time.Duration
	RateLimitBurst int
}

func NewDefaultConfig() Config {
	return Config{
		Enabled:        true,
		BaseURL:        "https://api.themoviedb.org/3",
		APIKey:         defaultTmdbAPIKey,
		RateLimit:      defaultRateLimit,
		RateLimitBurst: defaultRateLimitBurst,
	}
}

const (
	defaultTmdbAPIKey     = "9c6689fa83ae6814fbfb200d70bba3a8"
	defaultRateLimit      = time.Second / 20
	defaultRateLimitBurst = 5
)

// APIKeySettingsKey is the settings.Manager key an admin-configured API key is stored under,
// taking precedence over the env/file-configured one.
const APIKeySettingsKey = "tmdb_api_key"
