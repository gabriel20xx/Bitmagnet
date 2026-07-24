package integrations

import (
	"context"
	"fmt"

	"github.com/bitmagnet-io/bitmagnet/internal/integrations/qbittorrent"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

var ErrIntegrationDisabled = fmt.Errorf("integration is disabled")

func (m manager) Send(ctx context.Context, integrationID string, magnetURIs []string) error {
	integration, findErr := m.find(ctx, integrationID)
	if findErr != nil {
		return findErr
	}

	if !integration.Enabled {
		return ErrIntegrationDisabled
	}

	client, clientErr := newClient(integration)
	if clientErr != nil {
		return clientErr
	}

	return client.Send(ctx, magnetURIs)
}

// newClient builds the Client implementation for integration's type. Adding a new supported
// BitTorrent client only requires a new case here and an implementation of the Client interface.
func newClient(integration model.Integration) (Client, error) {
	switch integration.Type {
	case model.IntegrationTypeQbittorrent:
		return qbittorrent.New(integration.URL, integration.Username.String, integration.Password.String), nil
	default:
		return nil, fmt.Errorf("unsupported integration type: %s", integration.Type)
	}
}
