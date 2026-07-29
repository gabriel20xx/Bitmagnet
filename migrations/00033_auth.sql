-- +goose Up
-- +goose StatementBegin

-- bitmagnet currently has one local account. The constant unique index makes initial setup
-- race-safe without preventing a future migration to multiple accounts.
create table auth_users
(
    id            text primary key default gen_random_uuid(),
    username      text                     not null,
    password_hash text                     not null,
    created_at    timestamp with time zone not null,
    updated_at    timestamp with time zone not null
);

create unique index auth_users_singleton_idx on auth_users ((true));
create unique index auth_users_username_idx on auth_users (username);

create table auth_sessions
(
    id         text primary key default gen_random_uuid(),
    user_id    text                     not null references auth_users (id) on delete cascade,
    token_hash text                     not null unique,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone not null
);

create index auth_sessions_expiry_idx on auth_sessions (expires_at);
create index auth_sessions_user_idx on auth_sessions (user_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop table auth_sessions;
drop table auth_users;

-- +goose StatementEnd
