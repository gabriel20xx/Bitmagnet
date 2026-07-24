package integrations

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

// Client sends magnet links to a configured external BitTorrent client for download.
type Client interface {
	Send(ctx context.Context, magnetURIs []string) error
	// TestConnection checks that the client is reachable and its credentials are accepted.
	TestConnection(ctx context.Context) error
}

type ConnectionDetails struct {
	Type     model.IntegrationType
	URL      string
	Username string
	Password string
	// APIKey, if set, is used instead of Username/Password (e.g. qBittorrent >= v5.2.0's
	// Authorization: Bearer scheme).
	APIKey string
}

type CreateRequest struct {
	Type     model.IntegrationType
	Name     string
	Enabled  bool
	URL      string
	Username string
	Password string
	APIKey   string
}

type UpdateRequest struct {
	Name    *string
	Enabled *bool
	URL     *string
	// Username, if non-nil, replaces the stored username - an empty string clears it.
	Username *string
	// Password, if non-nil, replaces the stored password. Nil leaves the existing one unchanged,
	// since the API never returns the current password back to the client to be echoed back.
	Password *string
	// APIKey, if non-nil, replaces the stored API key. Nil leaves the existing one unchanged, for
	// the same reason as Password.
	APIKey *string
}

type Manager interface {
	List(ctx context.Context) ([]model.Integration, error)
	Create(ctx context.Context, req CreateRequest) (model.Integration, error)
	Update(ctx context.Context, id string, req UpdateRequest) (model.Integration, error)
	Delete(ctx context.Context, id string) error
	// Send delivers magnetURIs to the named integration's configured client.
	Send(ctx context.Context, integrationID string, magnetURIs []string) error
	// TestConnection checks connectivity using the given (possibly not yet saved) details.
	TestConnection(ctx context.Context, details ConnectionDetails) error
	// TestSavedConnection checks connectivity using an already-configured integration's stored details.
	TestSavedConnection(ctx context.Context, id string) error
}
