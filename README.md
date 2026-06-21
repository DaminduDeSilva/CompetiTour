# CompetiTour

**AI-powered package competitiveness intelligence for Destination Management Companies.**

> Team ZeroTrace · {PROXY}Maze'26 · Track 4: Vertical Intelligence Layer

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your Torch Labs + Anthropic credentials

# 2. Start everything
make up-build

# 3. Run migrations and seed data
make init

# 4. Open dashboard
open http://localhost:3000
```

## Architecture

- **Frontend**: Next.js 14 (App Router) → `:3000`
- **API**: FastAPI (Python) → `:8000`
- **Workers**: ARQ + Playwright (async task processing)
- **Database**: PostgreSQL 16
- **Queue**: Redis 7
- **Proxies**: Torch Labs (Premium Residential + ISP)

## Development

```bash
# Start with hot reload
make dev

# Run migrations
make migrate

# Generate new migration
make migration msg="add new table"

# Seed demo data
make seed

# View logs
make logs

# Run tests
make test

# Check proxy connectivity
make proxy-check
```

## Project Structure

```
CompetiTour/
├── backend/          # FastAPI + ARQ Workers + Playwright scrapers
├── frontend/         # Next.js dashboard
├── nginx/            # Reverse proxy config
├── scripts/          # Project-level utility scripts
└── docs/             # Documentation
```

## Team

| Member | Role |
|---|---|
| W. D. T. De Silva | Backend & API |
| S. B. Wickramanayake | Scraping & Proxy |
| E. K. K. D. R. Edirisinghe | AI/Matching |
| J. P. T. S. Jayasinghe | Frontend + Demo |
