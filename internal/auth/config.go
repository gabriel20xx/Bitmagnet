package auth

import "time"

type Config struct {
	SessionTTL   time.Duration
	CookieName   string
	CookieSecure bool
}

func NewDefaultConfig() Config {
	return Config{
		SessionTTL:   24 * time.Hour,
		CookieName:   "bitmagnet_session",
		CookieSecure: false,
	}
}
