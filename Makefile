.PHONY: up down build migrate seed logs shell-api shell-worker test

# Start all services
up:
	docker compose up -d

# Start with build
up-build:
	docker compose up -d --build

# Start dev mode (with hot reload)
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Stop all services
down:
	docker compose down

# Stop and remove volumes (DESTRUCTIVE)
clean:
	docker compose down -v

# Build all images
build:
	docker compose build

# Run Alembic migrations
migrate:
	docker compose exec api alembic upgrade head

# Generate a new migration
migration:
	docker compose exec api alembic revision --autogenerate -m "$(msg)"

# Seed database with initial data
seed:
	docker compose exec api python -m scripts.seed_markets
	docker compose exec api python -m scripts.seed_platforms
	docker compose exec api python -m scripts.seed_demo_packages

# Full init: migrate + seed
init: migrate seed

# View logs
logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-worker:
	docker compose logs -f worker

# Shell access
shell-api:
	docker compose exec api bash

shell-worker:
	docker compose exec worker bash

shell-db:
	docker compose exec postgres psql -U competitour -d competitour

# Run backend tests
test:
	docker compose exec api pytest -v

# Check proxy connectivity
proxy-check:
	docker compose exec worker python -c "from workers.proxy.health import check_proxy; import asyncio; asyncio.run(check_proxy('de'))"
