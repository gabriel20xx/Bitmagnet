// Package qbittorrent sends magnet links to a qBittorrent instance's WebUI API for download.
package qbittorrent

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
)

// Client talks to a qBittorrent WebUI instance to add torrents for download.
type Client struct {
	resty    *resty.Client
	username string
	password string
	apiKey   string
}

// New builds a client. If apiKey is set, it's used exclusively (qBittorrent >= v5.2.0's
// Authorization: Bearer scheme) and username/password are ignored - the two mechanisms are
// mutually exclusive, and the API key can't be used against the login endpoint anyway.
func New(baseURL, username, password, apiKey string) *Client {
	trimmedURL := strings.TrimRight(baseURL, "/")

	r := resty.New().
		// qBittorrent's WebUI validates Referer/Origin against the request host on every API
		// call (CSRF protection, on by default since v4.1) and returns 403 - not an auth
		// error - when they're missing, regardless of whether the credentials are correct.
		SetBaseURL(trimmedURL).
		SetHeader("Referer", trimmedURL).
		SetHeader("Origin", trimmedURL).
		SetTimeout(15 * time.Second)

	if apiKey != "" {
		r.SetAuthScheme("Bearer").SetAuthToken(apiKey)
	}

	return &Client{
		resty:    r,
		username: username,
		password: password,
		apiKey:   apiKey,
	}
}

func (c *Client) usesAPIKey() bool {
	return c.apiKey != ""
}

// Send logs in (if using username/password) and adds magnetURIs to qBittorrent in one call.
func (c *Client) Send(ctx context.Context, magnetURIs []string) error {
	if len(magnetURIs) == 0 {
		return nil
	}

	if !c.usesAPIKey() {
		if loginErr := c.login(ctx); loginErr != nil {
			return fmt.Errorf("qbittorrent login: %w", loginErr)
		}
	}

	res, err := c.resty.R().
		SetContext(ctx).
		SetFormData(map[string]string{"urls": strings.Join(magnetURIs, "\n")}).
		Post("/api/v2/torrents/add")
	if err != nil {
		return fmt.Errorf("qbittorrent add torrents: %w", err)
	}

	// A torrent already present in the client isn't a failure from the caller's perspective.
	if res.StatusCode() == http.StatusConflict {
		return nil
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

// TestConnection checks that qBittorrent's WebUI is reachable and that its credentials (either
// the API key, or - unlike login - the username/password even if empty) are accepted, so it
// also catches an unreachable/wrong URL.
func (c *Client) TestConnection(ctx context.Context) error {
	if c.usesAPIKey() {
		return c.testAPIKey(ctx)
	}

	return c.doLogin(ctx)
}

// testAPIKey hits an arbitrary authenticated, non-login endpoint, since API keys can't be used
// against /auth/login at all.
func (c *Client) testAPIKey(ctx context.Context) error {
	res, err := c.resty.R().SetContext(ctx).Get("/api/v2/app/version")
	if err != nil {
		return fmt.Errorf("qbittorrent unreachable: %w", err)
	}

	if !res.IsSuccess() {
		if body := strings.TrimSpace(string(res.Body())); body != "" {
			return fmt.Errorf("qbittorrent rejected the API key: HTTP %s: %s", res.Status(), body)
		}

		return fmt.Errorf("qbittorrent rejected the API key: HTTP %s", res.Status())
	}

	return nil
}

func (c *Client) doLogin(ctx context.Context) error {
	res, err := c.resty.R().
		SetContext(ctx).
		SetFormData(map[string]string{"username": c.username, "password": c.password}).
		Post("/api/v2/auth/login")
	if err != nil {
		return fmt.Errorf("qbittorrent unreachable: %w", err)
	}

	body := strings.TrimSpace(string(res.Body()))

	if !res.IsSuccess() {
		// qBittorrent bans an IP for a while after too many failed login attempts (Web UI
		// options), and returns 403 for every request - including well-formed ones - until the
		// ban expires. When it sends a body, it's usually the one place that says so.
		if body == "" {
			return fmt.Errorf("qbittorrent login request failed: HTTP %s", res.Status())
		}

		return fmt.Errorf("qbittorrent login request failed: HTTP %s: %s", res.Status(), body)
	}

	if body != "Ok." {
		return fmt.Errorf("qbittorrent rejected the credentials: %s", body)
	}

	return nil
}
