-- +goose Up
-- +goose StatementBegin

alter table workflows alter column integration_id drop not null;
alter table workflows add column favorites_list_id text references favorites_lists on delete set null;
alter table workflows add constraint workflows_has_action check (integration_id is not null or favorites_list_id is not null);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

alter table workflows drop constraint workflows_has_action;
alter table workflows drop column favorites_list_id;
alter table workflows alter column integration_id set not null;

-- +goose StatementEnd
