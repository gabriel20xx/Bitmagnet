package integrations

import (
	"context"
	"fmt"
	"sort"

	"github.com/bitmagnet-io/bitmagnet/internal/integrations/qbittorrent"
	"github.com/bitmagnet-io/bitmagnet/internal/model"
)

// ListActiveTorrents dispatches on the integration's type directly, rather than through the
// generic Client interface, since a live status query is qBittorrent-specific today and not every
// integration type will necessarily be able to support it the same way.
func (m manager) ListActiveTorrents(
	ctx context.Context,
	integrationID string,
	req ListActiveTorrentsRequest,
) (ListActiveTorrentsResult, error) {
	integration, findErr := m.find(ctx, integrationID)
	if findErr != nil {
		return ListActiveTorrentsResult{}, findErr
	}

	if !integration.Enabled {
		return ListActiveTorrentsResult{}, ErrIntegrationDisabled
	}

	var items []ActiveTorrent

	switch integration.Type {
	case model.IntegrationTypeQbittorrent:
		details := integrationConnectionDetails(integration)
		client := qbittorrent.New(details.URL, details.Username, details.Password, details.APIKey)

		torrents, err := client.ListActiveTorrents(ctx)
		if err != nil {
			return ListActiveTorrentsResult{}, err
		}

		items = make([]ActiveTorrent, len(torrents))
		for i, t := range torrents {
			items[i] = ActiveTorrent{
				Hash:          t.Hash,
				Name:          t.Name,
				Progress:      t.Progress,
				State:         t.State,
				DownloadSpeed: t.DownloadSpeed,
				ETA:           t.ETA,
				Size:          t.Size,
			}
		}
	default:
		return ListActiveTorrentsResult{}, fmt.Errorf("unsupported integration type: %s", integration.Type)
	}

	sortActiveTorrents(items, req.OrderBy, req.Descending)

	totalCount := uint(len(items))

	return ListActiveTorrentsResult{
		TotalCount: totalCount,
		Items:      paginate(items, req.Page, req.Limit),
	}, nil
}

func sortActiveTorrents(items []ActiveTorrent, orderBy ListActiveTorrentsOrderByField, descending bool) {
	less := func(i, j int) bool {
		switch orderBy {
		case ListActiveTorrentsOrderByProgress:
			return items[i].Progress < items[j].Progress
		case ListActiveTorrentsOrderByState:
			return items[i].State < items[j].State
		case ListActiveTorrentsOrderByDownloadSpeed:
			return items[i].DownloadSpeed < items[j].DownloadSpeed
		case ListActiveTorrentsOrderByETA:
			return items[i].ETA < items[j].ETA
		case ListActiveTorrentsOrderBySize:
			return items[i].Size < items[j].Size
		case ListActiveTorrentsOrderByName:
			fallthrough
		default:
			return items[i].Name < items[j].Name
		}
	}

	sort.SliceStable(items, func(i, j int) bool {
		if descending {
			return less(j, i)
		}

		return less(i, j)
	})
}

// paginate returns the requested 1-indexed page of items. A zero limit means unlimited (page is
// then meaningless and the full slice is returned).
func paginate(items []ActiveTorrent, page uint, limit uint) []ActiveTorrent {
	if limit == 0 {
		return items
	}

	if page == 0 {
		page = 1
	}

	start := (page - 1) * limit
	if start >= uint(len(items)) {
		return []ActiveTorrent{}
	}

	end := start + limit
	if end > uint(len(items)) {
		end = uint(len(items))
	}

	return items[start:end]
}
