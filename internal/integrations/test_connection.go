package integrations

import "context"

func (m manager) TestConnection(ctx context.Context, details ConnectionDetails) error {
	client, err := newClient(details)
	if err != nil {
		return err
	}

	return client.TestConnection(ctx)
}

func (m manager) TestSavedConnection(ctx context.Context, id string) error {
	integration, findErr := m.find(ctx, id)
	if findErr != nil {
		return findErr
	}

	client, clientErr := newClient(integrationConnectionDetails(integration))
	if clientErr != nil {
		return clientErr
	}

	return client.TestConnection(ctx)
}
