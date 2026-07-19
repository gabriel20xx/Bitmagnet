package postgres

import "testing"

const explicitDSN = "postgres://explicit"

//nolint:tparallel // two subtests use t.Setenv, which panics if an ancestor test has called t.Parallel
func TestCreateDSN(t *testing.T) {
	t.Run("explicit DSN takes priority", func(t *testing.T) {
		t.Parallel()

		cfg := Config{DSN: explicitDSN}

		if got := cfg.CreateDSN(); got != explicitDSN {
			t.Errorf("expected explicit DSN, got %q", got)
		}
	})

	t.Run("POSTGRESQL_URL is used when DSN is empty", func(t *testing.T) {
		t.Setenv("POSTGRESQL_URL", "postgres://from-env-url")

		cfg := Config{}

		if got := cfg.CreateDSN(); got != "postgres://from-env-url" {
			t.Errorf("expected POSTGRESQL_URL value, got %q", got)
		}
	})

	t.Run("explicit DSN takes priority over POSTGRESQL_URL", func(t *testing.T) {
		t.Setenv("POSTGRESQL_URL", "postgres://from-env-url")

		cfg := Config{DSN: explicitDSN}

		if got := cfg.CreateDSN(); got != explicitDSN {
			t.Errorf("expected explicit DSN to win, got %q", got)
		}
	})

	t.Run("falls back to discrete fields when neither is set", func(t *testing.T) {
		t.Parallel()

		cfg := Config{Host: "localhost", User: "postgres", Port: 5432, Name: "bitmagnet"}

		got := cfg.CreateDSN()
		if got == "" {
			t.Error("expected a non-empty DSN built from discrete fields")
		}
	})
}
