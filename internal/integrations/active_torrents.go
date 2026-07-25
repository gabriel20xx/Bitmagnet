package integrations

import (
	"context"
	"fmt"

	"github.com/bitmagnet-io/bitmagnet/internal/integrations/qbittorrent"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

// ListActiveTorrents dispatches on the integration's type directly, rather than through the
// generic Client interface, since a live status query is qBittorrent-specific today and not every
// integration type will necessarily be able to support it the same way.
func (m manager) ListActiveTorrents(ctx context.Context, integrationID string) ([]ActiveTorrent, error) {
	integration, findErr := m.find(ctx, integrationID)
	if findErr != nil {
		return nil, findErr
	}

	if !integration.Enabled {
		return nil, ErrIntegrationDisabled
	}

	switch integration.Type {
	case model.IntegrationTypeQbittorrent:
		details := integrationConnectionDetails(integration)
		client := qbittorrent.New(details.URL, details.Username, details.Password, details.APIKey)

		torrents, err := client.ListActiveTorrents(ctx)
		if err != nil {
			return nil, err
		}

		result := make([]ActiveTorrent, len(torrents))
		for i, t := range torrents {
			result[i] = ActiveTorrent{
				Hash:          t.Hash,
				Name:          t.Name,
				Progress:      t.Progress,
				State:         t.State,
				DownloadSpeed: t.DownloadSpeed,
				ETA:           t.ETA,
				Size:          t.Size,
			}
		}

		return result, nil
	default:
		return nil, fmt.Errorf("unsupported integration type: %s", integration.Type)
	}
}
