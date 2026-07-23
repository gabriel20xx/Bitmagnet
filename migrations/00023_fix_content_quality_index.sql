-- +goose Up
-- +goose StatementBegin

-- content_id is a free-form string with no length bound (e.g. for locally-matched content), and
-- including it directly in a btree index can exceed Postgres' ~8KB index row size limit for
-- torrents whose classification ends up with an unusually long content_id. Index a fixed-size
-- hash of it instead - equality lookups match on both the hash (to use the index) and the raw
-- value (to rule out the vanishingly unlikely case of a hash collision).
drop index if exists torrent_contents_content_quality_idx;
create index torrent_contents_content_quality_idx on torrent_contents (
    content_type, content_source, md5(content_id), video_resolution, video_source, video_codec
) where content_id is not null;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop index if exists torrent_contents_content_quality_idx;
create index torrent_contents_content_quality_idx on torrent_contents (
    content_type, content_source, content_id, video_resolution, video_source, video_codec
) where content_id is not null;

-- +goose StatementEnd
