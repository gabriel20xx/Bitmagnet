-- +goose Up
-- +goose StatementBegin

-- internal/processor/dedup.go's findCanonicalByContentQuality filters on
-- duplicate_of_info_hash IS NULL and orders by (seeders DESC NULLS LAST, created_at ASC) LIMIT 1
-- FOR UPDATE, none of which the previous index covered: every already-resolved-duplicate row for
-- a piece of content still had to be fetched from the heap to be filtered out, and every
-- surviving candidate had to be sorted in memory before picking the top one. For popular content
-- with many torrents, that's an expensive scan-and-sort on every classification. Folding
-- duplicate_of_info_hash IS NULL into the partial predicate excludes those rows from the index
-- entirely, and appending the ORDER BY columns lets Postgres walk the index in the exact order
-- needed and stop at the first match.
drop index if exists torrent_contents_content_quality_idx;
create index torrent_contents_content_quality_idx on torrent_contents (
    content_type, content_source, md5(content_id), video_resolution, video_source, video_codec,
    seeders desc nulls last, created_at asc
) where content_id is not null and duplicate_of_info_hash is null;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

drop index if exists torrent_contents_content_quality_idx;
create index torrent_contents_content_quality_idx on torrent_contents (
    content_type, content_source, md5(content_id), video_resolution, video_source, video_codec
) where content_id is not null;

-- +goose StatementEnd
