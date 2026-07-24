-- +goose Up
-- +goose StatementBegin

create table integrations
(
    id         text primary key default gen_random_uuid(),
    type       text                     not null,
    name       text                     not null,
    enabled    boolean                  not null default true,
    url        text                     not null,
    username   text,
    password   text,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop table integrations;

-- +goose StatementEnd
