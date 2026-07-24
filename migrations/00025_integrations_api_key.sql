-- +goose Up
-- +goose StatementBegin

alter table integrations add column api_key text;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

alter table integrations drop column api_key;

-- +goose StatementEnd
