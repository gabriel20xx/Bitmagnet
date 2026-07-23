-- +goose Up
-- +goose StatementBegin

-- file_fingerprint is a hash of a torrent's file listing (sizes of every file, sorted), computed
-- at process time. Two torrents sharing the same fingerprint are near-certainly the same release
-- repacked under a different info hash, regardless of whether content classification matched.
alter table torrents add column file_fingerprint bytea;
create index torrents_file_fingerprint_idx on torrents (file_fingerprint) where file_fingerprint is not null;

-- duplicate_of_info_hash points at the info_hash of the torrent this row is considered a
-- duplicate of (matched by file_fingerprint, or by identical content + quality). NULL means this
-- row is the canonical representative of its group (or no duplicate has been found for it).
-- Set null on delete rather than cascading, so a deleted canonical torrent doesn't take its whole
-- duplicate group down with it - the remaining rows simply become uncollapsed until reprocessed.
alter table torrent_contents add column duplicate_of_info_hash bytea references torrents (info_hash) on delete set null;
alter table torrent_contents add column duplicates_count integer not null default 0;
create index torrent_contents_duplicate_of_info_hash_idx on torrent_contents (duplicate_of_info_hash)
    where duplicate_of_info_hash is not null;
create index torrent_contents_content_quality_idx on torrent_contents (
    content_type, content_source, content_id, video_resolution, video_source, video_codec
) where content_id is not null;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop index if exists torrent_contents_content_quality_idx;
drop index if exists torrent_contents_duplicate_of_info_hash_idx;
alter table torrent_contents drop column duplicates_count;
alter table torrent_contents drop column duplicate_of_info_hash;

drop index if exists torrents_file_fingerprint_idx;
alter table torrents drop column file_fingerprint;

-- +goose StatementEnd
