-include .envrc

.PHONY: build
build:
	go build -o bin/web ./cmd/web

.PHONY: run
run:
	go run ./cmd/web -dsn ${DB_DSN} -gclientid ${GOOGLE_CLIENT_ID}

.PHONY: psql
psql:
	psql ${DB_DSN}

.PHONY: migrate_up
migrate_up:
	@echo "Running up migrations"
	migrate -path ./migrations -database ${DB_DSN} up

.PHONY: migrate_down
migrate_down:
	@echo "Running down migration"
	migrate -path ./migrations -database ${DB_DSN} down 1

.PHONY: create_migration
create_migration:
	@if [ -z "$(name)" ]; then \
		echo "Error: Migration name is required. Usage: make migration name=your_migration_name"; \
		exit 1; \
	fi
	@echo "Creating migration: $(name)"
	migrate create -ext sql -dir migrations -seq $(name)

.PHONY: force_migration
force_migration:
	@if [ -z "$(version)" ]; then \
		echo "Error: Migration version is required. Usage: make migration version=your_migration_version"; \
		exit 1; \
	fi
	@echo "Forcing migration version: $(version)"
	migrate -path ./migrations -database ${DB_DSN} force ${version}

.PHONY: migration_version
migration_version:
	migrate -path ./migrations -database ${DB_DSN} version
