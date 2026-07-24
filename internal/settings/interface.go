// Package settings stores small runtime-editable overrides for otherwise-static config values,
// in the (until now unused) key_values table.
package settings

import "context"

type Manager interface {
	// Get returns a stored value and whether it was found.
	Get(ctx context.Context, key string) (string, bool, error)
	// Set stores value under key, replacing any existing value.
	Set(ctx context.Context, key, value string) error
	// Delete removes key, if present.
	Delete(ctx context.Context, key string) error
}
