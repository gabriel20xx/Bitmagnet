// Package qbittorrent sends magnet links to a qBittorrent instance's WebUI API for download.
package qbittorrent

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
)

// Client talks to a qBittorrent WebUI instance to add torrents for download.
type Client struct {
	resty    *resty.Client
	username string
	password string
}

func New(baseURL, username, password string) *Client {
	return &Client{
		resty: resty.New().
			SetBaseURL(strings.TrimRight(baseURL, "/")).
			SetTimeout(15 * time.Second),
		username: username,
		password: password,
	}
}

// Send logs in (if credentials are configured) and adds magnetURIs to qBittorrent in one call.
func (c *Client) Send(ctx context.Context, magnetURIs []string) error {
	if len(magnetURIs) == 0 {
		return nil
	}

	if loginErr := c.login(ctx); loginErr != nil {
		return fmt.Errorf("qbittorrent login: %w", loginErr)
	}

	res, err := c.resty.R().
		SetContext(ctx).
		SetFormData(map[string]string{"urls": strings.Join(magnetURIs, "\n")}).
		Post("/api/v2/torrents/add")
	if err != nil {
		return fmt.Errorf("qbittorrent add torrents: %w", err)
	}

	if !res.IsSuccess() {
		return fmt.Errorf("qbittorrent add torrents: unexpected status %s", res.Status())
	}

	return nil
}

func (c *Client) login(ctx context.Context) error {
	if c.username == "" && c.password == "" {
		return nil
	}

	return c.doLogin(ctx)
}

// TestConnection checks that qBittorrent's WebUI is reachable and, if credentials are
// configured, that they're accepted - unlike login, it always makes the request rather than
// skipping it when no credentials are set, so it also catches an unreachable/wrong URL.
func (c *Client) TestConnection(ctx context.Context) error {
	return c.doLogin(ctx)
}

func (c *Client) doLogin(ctx context.Context) error {
	res, err := c.resty.R().
		SetContext(ctx).
		SetFormData(map[string]string{"username": c.username, "password": c.password}).
		Post("/api/v2/auth/login")
	if err != nil {
		return fmt.Errorf("qbittorrent unreachable: %w", err)
	}

	if !res.IsSuccess() || string(res.Body()) != "Ok." {
		return errors.New("qbittorrent rejected the credentials")
	}

	return nil
}
