-- +goose Up
-- +goose StatementBegin

-- The queue throughput chart (queuemetrics.client.Request) filters queue_jobs by created_at/ran_at
-- and reads queue/status/ran_at/run_after per matching row to compute buckets and latency. Neither
-- column was indexed, so this query was always a sequential scan of the entire queue_jobs table -
-- which only ever grows (jobs aren't pruned automatically, see manager.PurgeJobs) - on every page
-- load/poll of the metrics page. On a long-running instance this seq scan saturates disk I/O long
-- enough to stall unrelated writes elsewhere (observed as spurious 30s+ "SLOW SQL" warnings from the
-- dht crawler while the metrics page was open). Covering indexes on created_at and ran_at let
-- Postgres satisfy the common "recent window" queries with index (-only) scans instead, mirroring
-- the fix already applied to torrents_torrent_sources in 00031.
create index queue_jobs_created_at_idx on queue_jobs (created_at)
  include (queue, status, ran_at, run_after);
create index queue_jobs_ran_at_idx on queue_jobs (ran_at)
  include (queue, status, created_at, run_after);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop index if exists queue_jobs_created_at_idx;
drop index if exists queue_jobs_ran_at_idx;

-- +goose StatementEnd
