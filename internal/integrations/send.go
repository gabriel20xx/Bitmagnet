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

	client, clientErr := newClient(integrationConnectionDetails(integration))
	if clientErr != nil {
		return clientErr
	}

	return client.Send(ctx, magnetURIs)
}

func integrationConnectionDetails(integration model.Integration) ConnectionDetails {
	return ConnectionDetails{
		Type:     integration.Type,
		URL:      integration.URL,
		Username: integration.Username.String,
		Password: integration.Password.String,
	}
}

// newClient builds the Client implementation for details.Type. Adding a new supported
// BitTorrent client only requires a new case here and an implementation of the Client interface.
func newClient(details ConnectionDetails) (Client, error) {
	switch details.Type {
	case model.IntegrationTypeQbittorrent:
		return qbittorrent.New(details.URL, details.Username, details.Password), nil
	default:
		return nil, fmt.Errorf("unsupported integration type: %s", details.Type)
	}
}
