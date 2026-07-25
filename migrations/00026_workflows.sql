-- +goose Up
-- +goose StatementBegin

create table workflows
(
    id               text primary key default gen_random_uuid(),
    name             text                     not null,
    enabled          boolean                  not null default true,
    integration_id   text                     not null references integrations (id) on delete cascade,
    match_on_rematch boolean                  not null default false,
    criteria         jsonb                    not null default '{}',
    created_at       timestamp with time zone not null,
    updated_at       timestamp with time zone not null
);

create index workflows_integration_id_idx on workflows (integration_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop table workflows;

-- +goose StatementEnd
