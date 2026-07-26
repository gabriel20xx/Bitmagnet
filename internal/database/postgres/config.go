package postgres

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Host              string
	User              string
	Port              uint
	Name              string
	ConnectionTimeout uint
	SSLMode           string
	SSLCertPath       string
	SSLKeyPath        string
	SSLRootCertPath   string
	// PoolMaxConns caps the shared pgx connection pool. Left at pgxpool's own default
	// (max(4, runtime.NumCPU())), the pool is too small once the DHT crawler's pipelines, the
	// GraphQL API, and queue processing are all drawing from it at once: everything ends up
	// queueing for a free connection, which surfaces as spurious gorm "slow SQL" warnings on
	// queries (including trivially fast ones, even a SELECT ... FOR UPDATE SKIP LOCKED dequeue
	// returning zero rows) that are actually just waiting on the pool, not running slowly.
	PoolMaxConns uint
}

func NewDefaultConfig() Config {
	return Config{
		Host:         "localhost",
		User:         "postgres",
		Port:         5432,
		Name:         "bitmagnet",
		PoolMaxConns: 50,
	}
}

func (c *Config) CreateDSN() string {
	// POSTGRESQL_URL doesn't fit the config system's POSTGRES_<FIELD> env naming
	// convention, so it can't be bound to a struct field automatically. It's
	// supported explicitly here, for compatibility with platforms (Railway,
	// Coolify, etc.) that inject it for their managed Postgres add-ons.
	if url := os.Getenv("POSTGRESQL_URL"); url != "" {
		return url
	}

	vals := dbValues(c)
	p := make([]string, 0, len(vals))

	for k, v := range vals {
		p = append(p, fmt.Sprintf("%s=%s", k, v))
	}

	return strings.Join(p, " ")
}

func setIfNotEmpty(m map[string]string, key string, val interface{}) {
	strVal := fmt.Sprintf("%v", val)
	if strVal != "" {
		m[key] = strVal
	}
}

func setIfPositive(m map[string]string, key string, val uint) {
	if val > 0 {
		m[key] = fmt.Sprintf("%d", val)
	}
}

func dbValues(cfg *Config) map[string]string {
	p := map[string]string{}
	setIfNotEmpty(p, "dbname", cfg.Name)
	setIfNotEmpty(p, "user", cfg.User)
	setIfNotEmpty(p, "host", cfg.Host)
	setIfNotEmpty(p, "port", fmt.Sprintf("%d", cfg.Port))
	setIfNotEmpty(p, "sslmode", cfg.SSLMode)
	setIfPositive(p, "connect_timeout", cfg.ConnectionTimeout)
	setIfNotEmpty(p, "sslcert", cfg.SSLCertPath)
	setIfNotEmpty(p, "sslkey", cfg.SSLKeyPath)
	setIfNotEmpty(p, "sslrootcert", cfg.SSLRootCertPath)
	setIfPositive(p, "pool_max_conns", cfg.PoolMaxConns)

	return p
}
