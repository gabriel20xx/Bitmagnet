package gqlmodel

import (
	"context"
	"errors"
	"strings"

	"github.com/bitmagnet-io/bitmagnet/internal/settings"
	"github.com/bitmagnet-io/bitmagnet/internal/tmdb"
)

type TmdbQuery struct {
	SettingsManager settings.Manager
}

func (q TmdbQuery) HasCustomApiKey(ctx context.Context) (bool, error) {
	_, ok, err := q.SettingsManager.Get(ctx, tmdb.APIKeySettingsKey)

	return ok, err
}

type TmdbMutation struct {
	SettingsManager settings.Manager
	Client          tmdb.Client
}

func (m TmdbMutation) SetApiKey(ctx context.Context, apiKey string) (*string, error) {
	apiKey = strings.TrimSpace(apiKey)
	if apiKey == "" {
		return nil, errors.New("api key must not be empty")
	}

	if err := m.SettingsManager.Set(ctx, tmdb.APIKeySettingsKey, apiKey); err != nil {
		return nil, err
	}

	m.Client.InvalidateAPIKey()

	return nil, nil
}

func (m TmdbMutation) ClearApiKey(ctx context.Context) (*string, error) {
	if err := m.SettingsManager.Delete(ctx, tmdb.APIKeySettingsKey); err != nil {
		return nil, err
	}

	m.Client.InvalidateAPIKey()

	return nil, nil
}
