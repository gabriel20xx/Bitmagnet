-- +goose Up
-- +goose StatementBegin

-- Replaces the plain (queue, status) index: the dequeue query filters on queue + status IN
-- ('pending', 'retry') + run_after, and orders by (status, priority, run_after). Without
-- priority/run_after in the index, postgres has to materialize and sort every eligible job for
-- the queue on every dequeue attempt, which becomes very slow once a queue has a large backlog.
drop index if exists queue_jobs_queue_status_idx;
create index on queue_jobs (queue, status, priority, run_after, id) where status in ('pending', 'retry');

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop index if exists queue_jobs_queue_status_priority_run_after_id_idx;
create index on queue_jobs (queue, status);

-- +goose StatementEnd
