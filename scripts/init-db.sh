#!/usr/bin/env bash
set -e

echo "Waiting for postgres to be ready..."
until docker compose exec postgres pg_isready -U competitour -d competitour; do
  sleep 2
done

echo "Running Alembic migrations..."
docker compose exec api alembic upgrade head

echo "Seeding initial data..."
docker compose exec api python -m scripts.seed_markets
docker compose exec api python -m scripts.seed_platforms

echo "Seeding demo packages..."
docker compose exec api python -m scripts.seed_demo_packages

echo "Database initialization complete!"
