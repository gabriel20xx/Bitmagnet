# bitmagnet

**A self-hosted BitTorrent indexer, DHT crawler, content classifier and torrent search engine, with a web UI, GraphQL API, and Servarr stack integration.**

> [!WARNING]
> This software is in alpha. It's ready to preview some interesting and unique features, but there will likely be bugs, as well as API and database schema changes before a 1.0 release.

## What is bitmagnet?

You might already know that enabling DHT in a BitTorrent client lets you find peers announcing a torrent hash to a Distributed Hash Table, rather than to a centralized tracker. DHT's lesser-known feature is that it also lets you _crawl_ the info hashes it knows about.

That's how bitmagnet's DHT crawler works: it crawls the DHT network, requests metadata for every info hash it discovers, and then classifies and enriches that metadata against known content (movies, TV shows, music, etc.), pulling in extra detail from sources like [The Movie Database](https://www.themoviedb.org/). Everything it indexes becomes searchable through the web UI or the GraphQL API.

This means bitmagnet isn't reliant on any external tracker or torrent indexer — it's a self-contained, self-hosted indexer connected via DHT to a global swarm of peers, constantly discovering new content on its own.

**bitmagnet does not download, store, or distribute any torrent content itself** — only metadata _about_ content (name, size, files, classification). See [Frequently asked questions](#frequently-asked-questions) below for more on this and other common questions.

## Features

- A DHT crawler and protocol implementation
- A generic BitTorrent indexer — bitmagnet can index torrents from any source, not just the DHT network, via its `/import` HTTP endpoint
- A highly customizable content classifier that identifies content type, language, resolution, source (BluRay, WEBRip, etc.), and enriches results with data from TMDB
- A torrent search engine with faceted search (source, tags, file type, language, genre, resolution, ...)
- A GraphQL API, with an embedded GraphQL Playground at `/graphql`
- A responsive, multilingual web UI built with React and Tailwind CSS
- A Torznab-compatible endpoint for integration with the [Servarr stack](https://wiki.servarr.com/) (Prowlarr, Sonarr, Radarr, etc.)
- A dashboard for monitoring queues, ingestion throughput, and system health

## Quick start (Docker Compose)

The quickest way to get up and running is with [Docker Compose](https://docs.docker.com/compose/):

```yaml
services:
  bitmagnet:
    image: ghcr.io/bitmagnet-io/bitmagnet:latest
    container_name: bitmagnet
    ports:
      # API and Web UI port:
      - "3333:3333"
      # BitTorrent ports:
      - "3334:3334/tcp"
      - "3334:3334/udp"
    restart: unless-stopped
    environment:
      - POSTGRESQL_URL=postgres://postgres:postgres@postgres:5432/bitmagnet
      # - TMDB_API_KEY=your_api_key
    volumes:
      - ./config:/root/.config/bitmagnet
    command:
      - worker
      - run
      - --keys=http_server
      - --keys=queue_server
      # remove the next line to run without the DHT crawler
      - --keys=dht_crawler
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    container_name: bitmagnet-postgres
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=bitmagnet
      - PGUSER=postgres
    shm_size: 1g
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      start_period: 20s
      interval: 10s
```

Run `docker compose up -d`, then open `http://localhost:3333`. The DHT crawler starts immediately, and you should see torrents appear in the web UI within a couple of minutes.

To upgrade an existing installation:

```sh
docker compose down bitmagnet
docker pull ghcr.io/bitmagnet-io/bitmagnet:latest
docker compose up -d bitmagnet
```

It's recommended to run bitmagnet behind a VPN (e.g. [gluetun](https://github.com/qdm12/gluetun-wiki)) — see [Frequently asked questions](#frequently-asked-questions).

### `go install`

You can also install bitmagnet natively:

```sh
go install github.com/bitmagnet-io/bitmagnet@latest
```

You'll need to configure at least a Postgres connection (see [Configuration](#configuration) below).

### Running the CLI

The bitmagnet CLI is the entrypoint into the application: `bitmagnet` if you installed it with `go install`, or `docker exec -it bitmagnet bitmagnet` if you're running it via the Compose example above.

```sh
bitmagnet --help
```

bitmagnet runs as multiple worker processes that can be started together or individually:

```sh
# start everything
bitmagnet worker run --all

# or start specific workers
bitmagnet worker run --keys=http_server --keys=queue_server --keys=dht_crawler
```

## Configuration

Configuration paths are dot-delimited. In a `config.yml` file, each dot is a nesting level:

```yaml
log:
  json: true
tmdb:
  api_key: my-api-key
http_server:
  cors:
    allowed_origins:
      - https://example1.com
      - https://example2.com
```

The same values can be set as environment variables by upper-casing the path and replacing dots with underscores:

```sh
LOG_JSON=true \
TMDB_API_KEY=my-api-key \
HTTP_SERVER_CORS_ALLOWED_ORIGINS=https://example1.com,https://example2.com \
  bitmagnet config show
```

Configuration is read, in order of precedence, from: environment variables, the config files listed in `EXTRA_CONFIG_FILES` (comma-separated), `./config.yml`, the [XDG](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html) user config directory, then built-in defaults. Run `bitmagnet config show` to see every available option, its type, current value, default, and where it was sourced from.

A few of the more commonly-tweaked options:

| Option                                                                    | Default                                          | Description                                                                                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `postgres.host` / `postgres.name` / `postgres.user`                      | `localhost` / `bitmagnet` / `postgres`           | Postgres connection settings, used when `POSTGRESQL_URL` isn't set.                                                          |
| `POSTGRESQL_URL` (env var only)                                           | _empty_                                          | A full Postgres connection string, takes priority over the discrete `postgres.*` settings above.                             |
| `tmdb.api_key`                                                            | _empty_                                          | Your own [TMDB](https://developer.themoviedb.org/docs) API key — see below.                                                   |
| `tmdb.enabled`                                                            | `true`                                           | Set to `false` to disable TMDB integration entirely.                                                                          |
| `dht_crawler.save_files_threshold`                                        | `100`                                            | Maximum number of files saved per torrent (large torrents can have many thousands).                                           |
| `dht_crawler.scaling_factor`                                              | `10`                                             | A rough proxy for DHT crawler resource usage/concurrency.                                                                     |
| `log.level` / `log.json` / `log.development`                              | `info` / `false` / `false`                       | Logging verbosity and format.                                                                                                 |
| `http_server.options`                                                     | `["*"]`                                          | Enabled HTTP server components: `cors`, `pprof`, `graphql`, `import`, `prometheus`, `torznab`, `status`, `webui`.             |

### Obtaining a TMDB API key

bitmagnet uses [the TMDB API](https://developer.themoviedb.org/docs) to fetch metadata for movies and TV shows. By default you share a rate-limited API key with other users (1 request/second) — enough to run the DHT crawler, but a bottleneck if you're importing and classifying content in bulk. [Register for a free TMDB API key](https://kb.synology.com/en-au/DSM/tutorial/How_to_apply_for_a_personal_API_key_to_get_video_info) and set `tmdb.api_key` to raise your limit to 20 requests/second. TMDB integration can be disabled entirely with `tmdb.enabled: false`.

## Servarr integration

bitmagnet's HTTP server exposes a Torznab-compatible endpoint at `/torznab`, for integration with [the Servarr stack](https://wiki.servarr.com/) (Prowlarr, Sonarr, Radarr, etc.). In Prowlarr, add a "Generic Torznab" indexer pointing at `http://bitmagnet:3333/torznab` (assuming Prowlarr is on the same Docker network) — no further configuration should be needed.

## Web UI

bitmagnet ships with a responsive, multilingual (14 languages) web UI, built with React and Tailwind CSS, covering torrent search with faceted filtering, tag management, a monitoring dashboard, and queue administration. It lives in [`webui/`](webui) and is embedded into the Go binary, served at `/webui`.

## Development

Requires Go 1.26+, Node.js 24+, and Postgres. A [Nix](https://nixos.org/download/) dev shell is provided (`nix develop`) with all required tooling. Common tasks are run via [go-task](https://taskfile.dev/):

```sh
task build        # build the bitmagnet binary
task test         # run Go and web UI tests
task lint         # run linters
task migrate      # apply database migrations
task serve-webui  # run the web UI in dev mode
```

See `Taskfile.yml` for the full list of tasks, and `.github/workflows/` for how they're wired into CI.

## Frequently asked questions

**Does bitmagnet download or distribute any illegal or copyright-infringing content?**
No. bitmagnet does not download, store, or distribute any content at all — only metadata _about_ content. It may index metadata about illegal or infringing content, so exercise discretion in any magnet links you add to your BitTorrent client. bitmagnet attempts to detect and filter harmful content such as CSAM to keep it out of the index.

**Should I use a VPN with bitmagnet?**
It's recommended. bitmagnet may download metadata about illegal or copyrighted content, and while we're not aware of anyone getting in trouble for running a metadata crawler like this, it's better to be safe. [Mullvad](https://mullvad.net/) and [ProtonVPN](https://protonvpn.com/) are solid choices if you don't already have one; [gluetun](https://github.com/qdm12/gluetun-wiki) makes it easy to route a container through a VPN.

**Is bitmagnet intended to be run as a public service?**
No — it's designed to be self-hosted. The UI and API allow destructive actions, and it hasn't had a security or scalability review.

**What are the system requirements?**
Roughly 300MB RAM for bitmagnet and at least 1GB for Postgres, plus about 80GB of disk per 10 million torrents indexed. Postgres performs best with plenty of RAM and an SSD.

**I just started bitmagnet and don't see any torrents yet — is something wrong?**
Give it up to ~10 minutes (the search cache TTL); the refresh button in the torrent listing bypasses the cache. Newly inserted torrents also need a background queue job to run before they appear. If nothing shows up after a while, check the health indicator in the toolbar (or `bitmagnet config show`/the queue dashboard) to confirm all workers are running.

## Contributing

Contributions are welcome — please open an issue or pull request. Are you an experienced developer with knowledge of Go, Postgres, TypeScript/React, and/or the BitTorrent protocol? This project is too big for one person, so if you're interested in contributing please review the open issues and feel free to open a PR.

## Tech stack

- [Go](https://go.dev/) backend with [gin](https://gin-gonic.com/), [gorm](https://gorm.io/), [gqlgen](https://gqlgen.com/), [fx](https://uber-go.github.io/fx/) for dependency injection, and [zap](https://github.com/uber-go/zap) for logging
- [Postgres](https://www.postgresql.org/) for storage
- [React](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) web UI, embedded in the Go binary and served via gin
- A [Nix](https://nixos.org/download/) dev shell for a reproducible development environment (`nix develop`, ideally paired with [nix-direnv](https://github.com/nix-community/nix-direnv))
