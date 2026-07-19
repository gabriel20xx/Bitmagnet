package postgres

import "testing"

func TestCreateDSN(t *testing.T) {
	t.Run("POSTGRESQL_URL is used when set", func(t *testing.T) {
		t.Setenv("POSTGRESQL_URL", "postgres://from-env-url")

		cfg := Config{}

		if got := cfg.CreateDSN(); got != "postgres://from-env-url" {
			t.Errorf("expected POSTGRESQL_URL value, got %q", got)
		}
	})

	t.Run("falls back to discrete fields when unset", func(t *testing.T) {
		cfg := Config{Host: "localhost", User: "postgres", Port: 5432, Name: "bitmagnet"}

		got := cfg.CreateDSN()
		if got == "" {
			t.Error("expected a non-empty DSN built from discrete fields")
		}
	})
}
