package postgres

import "testing"

// TestCreateDSN itself can't call t.Parallel(): its first subtest uses t.Setenv, which panics
// if the test (or an ancestor) runs in parallel.
//
//nolint:tparallel
func TestCreateDSN(t *testing.T) {
	t.Run("POSTGRESQL_URL is used when set", func(t *testing.T) {
		t.Setenv("POSTGRESQL_URL", "postgres://from-env-url")

		cfg := Config{}

		if got := cfg.CreateDSN(); got != "postgres://from-env-url" {
			t.Errorf("expected POSTGRESQL_URL value, got %q", got)
		}
	})

	t.Run("falls back to discrete fields when unset", func(t *testing.T) {
		t.Parallel()

		cfg := Config{Host: "localhost", User: "postgres", Port: 5432, Name: "bitmagnet"}

		got := cfg.CreateDSN()
		if got == "" {
			t.Error("expected a non-empty DSN built from discrete fields")
		}
	})
}
