-- +goose Up
-- +goose StatementBegin

-- pg_trgm is already enabled (see 00001_init.sql), re-adding a plain-text companion
-- column to "tsv" so trigram similarity can be used for typo-tolerant matching, the
-- same way "search_string" worked prior to 00006_tsv.sql (which dropped it in favor
-- of the Go-computed "tsv" column alone).

-- indexed on lower(search_string) since matching is done case-insensitively (to line up
-- with the existing tsv/tsquery matching, which is already case-insensitive)

alter table "content" add column "search_string" text not null default '';
CREATE INDEX content_search_string_trgm_idx ON content USING gist (lower(search_string) gist_trgm_ops);

alter table "torrent_contents" add column "search_string" text not null default '';
CREATE INDEX torrent_contents_search_string_trgm_idx ON torrent_contents USING gist (lower(search_string) gist_trgm_ops);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS torrent_contents_search_string_trgm_idx;
alter table "torrent_contents" drop column "search_string";

DROP INDEX IF EXISTS content_search_string_trgm_idx;
alter table "content" drop column "search_string";

-- +goose StatementEnd
