package processor

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/model"
	"github.com/bitmagnet-io/bitmagnet/internal/protocol"
)

type pendingWorkflowSend struct {
	infoHash        protocol.ID
	integrationID   *string
	favoritesListID *string
	magnetURI       string
}

// matchingWorkflowSends returns, for every enabled workflow whose criteria matches (torrent, tc),
// the send it triggers. isNewContent should be true only the first time this info hash has ever
// been classified - workflows only fire on rematches of already-known torrents if they opt in via
// MatchOnRematch.
func matchingWorkflowSends(
	enabledWorkflows []model.Workflow,
	isNewContent bool,
	torrent model.Torrent,
	tc model.TorrentContent,
) []pendingWorkflowSend {
	var sends []pendingWorkflowSend

	for _, wf := range enabledWorkflows {
		if !isNewContent && !wf.MatchOnRematch {
			continue
		}

		if wf.Criteria.Matches(torrent, tc) {
			sends = append(sends, pendingWorkflowSend{
				infoHash:        torrent.InfoHash,
				integrationID:   wf.IntegrationID,
				favoritesListID: wf.FavoritesListID,
				magnetURI:       torrent.MagnetURI(),
			})
		}
	}

	return sends
}

// sendPendingWorkflows delivers pending sends to their target integrations and favorites lists.
// Integration sends are grouped so each integration is called once; favorites lists are assigned
// one torrent at a time, since there's no batch equivalent of Send. Failures are logged, not
// returned - a workflow send failure must not roll back or fail the classification/persistence
// that already succeeded.
func (c processor) sendPendingWorkflows(ctx context.Context, pending []pendingWorkflowSend) {
	if len(pending) == 0 {
		return
	}

	magnetURIsByIntegration := make(map[string][]string)

	for _, send := range pending {
		if send.integrationID != nil {
			magnetURIsByIntegration[*send.integrationID] = append(
				magnetURIsByIntegration[*send.integrationID],
				send.magnetURI,
			)
		}

		if send.favoritesListID != nil {
			if err := c.favoritesManager.SetFavorite(ctx, send.infoHash, *send.favoritesListID); err != nil {
				c.logger.Errorw(
					"workflow: failed to add torrent to favorites list",
					"favoritesListId", *send.favoritesListID,
					"infoHash", send.infoHash.String(),
					"error", err,
				)
			}
		}
	}

	for integrationID, magnetURIs := range magnetURIsByIntegration {
		if err := c.integrationsManager.Send(ctx, integrationID, magnetURIs); err != nil {
			c.logger.Errorw(
				"workflow: failed to send torrents to integration",
				"integrationId", integrationID,
				"error", err,
			)
		}
	}
}
