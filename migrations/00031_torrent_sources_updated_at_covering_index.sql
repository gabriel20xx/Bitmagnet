-- +goose Up
-- +goose StatementBegin

-- The torrent throughput chart (torrentmetrics.client.Request) filters
-- torrents_torrent_sources by updated_at and then reads source/created_at per matching row to
-- compute buckets. The plain updated_at index required a heap fetch per row; making it a covering
-- index lets Postgres satisfy the common "recent window" queries (the default chart view: last
-- hour, minute buckets) with an index-only scan instead, verified via EXPLAIN ANALYZE against a
-- 1M-row synthetic dataset to cut execution time roughly in half to a third for hour/day-range
-- queries, with no regression for full-week queries (planner already prefers a seq scan there).
drop index if exists torrents_torrent_sources_updated_at_idx;
create index torrents_torrent_sources_updated_at_idx on torrents_torrent_sources (updated_at)
  include (source, created_at);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop index if exists torrents_torrent_sources_updated_at_idx;
create index torrents_torrent_sources_updated_at_idx on torrents_torrent_sources (updated_at);

-- +goose StatementEnd
