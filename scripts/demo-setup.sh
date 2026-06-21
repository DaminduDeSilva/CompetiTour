#!/usr/bin/env bash
set -e

echo "Resetting demo environment..."

# Tear down everything
docker compose down -v

# Rebuild and start
docker compose up -d --build

# Wait for healthy services
echo "Waiting for API to be healthy..."
sleep 10 # Adjust if needed or use healthcheck curl

# Initialize DB
./scripts/init-db.sh

echo "Demo environment is ready at http://localhost:3000"
