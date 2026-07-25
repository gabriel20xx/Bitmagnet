-- +goose Up
-- +goose StatementBegin

create table favorites_lists
(
  id         text primary key default gen_random_uuid(),
  name       text                     not null,
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null
);

create table torrent_favorites
(
  info_hash         bytea                    not null primary key references torrents on delete cascade,
  favorites_list_id text                     not null references favorites_lists on delete cascade,
  created_at        timestamp with time zone not null
);
create index on torrent_favorites (favorites_list_id);

-- Migrate torrents already marked with the legacy "starred" tag into a new default list, then
-- retire that tag - the star button is being replaced by list-based favorites.
insert into favorites_lists (id, name, created_at, updated_at)
select gen_random_uuid(), 'Favorites', now(), now()
where exists (select 1 from torrent_tags where name = 'starred');

insert into torrent_favorites (info_hash, favorites_list_id, created_at)
select torrent_tags.info_hash, favorites_lists.id, now()
from torrent_tags, favorites_lists
where torrent_tags.name = 'starred'
  and favorites_lists.name = 'Favorites'
on conflict (info_hash) do nothing;

delete from torrent_tags where name = 'starred';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop table if exists torrent_favorites cascade;
drop table if exists favorites_lists cascade;

-- +goose StatementEnd
