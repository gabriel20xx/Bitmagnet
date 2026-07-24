package gqlmodel

import (
	"context"
	"database/sql/driver"

	"github.com/bitmagnet-io/bitmagnet/internal/database/dao"
	"github.com/bitmagnet-io/bitmagnet/internal/gql/gqlmodel/gen"
	"github.com/bitmagnet-io/bitmagnet/internal/integrations"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
)

type IntegrationsMutation struct {
	Manager integrations.Manager
	Dao     *dao.Query
}

func (m IntegrationsMutation) Create(ctx context.Context, input gen.CreateIntegrationInput) (model.Integration, error) {
	req := integrations.CreateRequest{
		Type:    input.Type,
		Name:    input.Name,
		Enabled: true,
		URL:     input.URL,
	}

	if enabled, ok := input.Enabled.ValueOK(); ok && enabled != nil {
		req.Enabled = *enabled
	}

	if username, ok := input.Username.ValueOK(); ok && username != nil {
		req.Username = *username
	}

	if password, ok := input.Password.ValueOK(); ok && password != nil {
		req.Password = *password
	}

	return m.Manager.Create(ctx, req)
}

func (m IntegrationsMutation) Update(
	ctx context.Context,
	id string,
	input gen.UpdateIntegrationInput,
) (model.Integration, error) {
	req := integrations.UpdateRequest{}

	if name, ok := input.Name.ValueOK(); ok {
		req.Name = name
	}

	if enabled, ok := input.Enabled.ValueOK(); ok {
		req.Enabled = enabled
	}

	if url, ok := input.URL.ValueOK(); ok {
		req.URL = url
	}

	if username, ok := input.Username.ValueOK(); ok {
		req.Username = username
	}

	if password, ok := input.Password.ValueOK(); ok {
		req.Password = password
	}

	return m.Manager.Update(ctx, id, req)
}

func (m IntegrationsMutation) Delete(ctx context.Context, id string) (*string, error) {
	return nil, m.Manager.Delete(ctx, id)
}

func (m IntegrationsMutation) SendTorrents(ctx context.Context, integrationID string, infoHashes []protocol.ID) (*string, error) {
	valuers := make([]driver.Valuer, len(infoHashes))
	for i, h := range infoHashes {
		valuers[i] = h
	}

	torrents, findErr := m.Dao.Torrent.WithContext(ctx).Where(m.Dao.Torrent.InfoHash.In(valuers...)).Find()
	if findErr != nil {
		return nil, findErr
	}

	magnetURIs := make([]string, len(torrents))
	for i, t := range torrents {
		magnetURIs[i] = t.MagnetURI()
	}

	return nil, m.Manager.Send(ctx, integrationID, magnetURIs)
}

func (m IntegrationsMutation) Test(ctx context.Context, input gen.TestIntegrationInput) (bool, error) {
	details := integrations.ConnectionDetails{
		Type: input.Type,
		URL:  input.URL,
	}

	if username, ok := input.Username.ValueOK(); ok && username != nil {
		details.Username = *username
	}

	if password, ok := input.Password.ValueOK(); ok && password != nil {
		details.Password = *password
	}

	if err := m.Manager.TestConnection(ctx, details); err != nil {
		return false, err
	}

	return true, nil
}

func (m IntegrationsMutation) TestSaved(ctx context.Context, id string) (bool, error) {
	if err := m.Manager.TestSavedConnection(ctx, id); err != nil {
		return false, err
	}

	return true, nil
}
