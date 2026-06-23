# CompetiTour — Full Product Architecture Plan

> **Status:** Frontend demo shell complete. Backend, admin console, and full DMC portal screens are defined below.  
> **Current build:** All pages listed here exist as hardcoded frontend prototypes. TODO comments mark every point where backend API calls, WebSocket streams, and DB queries will be wired in.

---

## Overview

CompetiTour is a **multi-tenant B2B SaaS platform** operated by **ZeroTrace**. DMCs subscribe to the product and never touch proxy infrastructure directly. ZeroTrace owns the Torch Labs account, manages scraper workers, and serves results via a clean API to each tenant.

| Layer | Who uses it | What it does |
|-------|-------------|--------------|
| **DMC Portal** (`/dashboard`, `/packages`, `/reports`, `/settings`) | Horizon DMC, Jetwing, etc. | Submit packages, trigger audits, read reports |
| **Admin Console** (`/admin/*`) | ZeroTrace internal team | Manage tenants, proxy pools, worker health, billing |
| **Backend API + Workers** (Phase 3–4) | Both portals + internal jobs | FastAPI, Playwright scrapers, AI pipeline, PostgreSQL |

---

## Layer 1 — DMC Portal Frontend

### Built (Demo Shell)
- Landing page with 3D globe
- `/dashboard` — package metrics, trend chart
- `/packages/new` — new package form with market/platform/proxy selection
- `/packages/[id]/analyze` — real-time audit stepper (hardcoded)
- `/reports/[id]/history` — competitiveness report + historical log
- `/settings` — proxy read-only, LLM matcher config

### Missing → Now Built as Prototype
- `/login` — DMC login page (hardcoded auth)
- `/packages` — package list with status/filter
- `/packages/[id]` — package detail + edit
- `/reports` — reports index across all packages
- `/notifications` — alert history page
- Settings Workspace tab — company profile, notification prefs, plan tier

---

## Layer 2 — Admin Console Frontend

### All Missing → Now Built as Prototype
- `/admin/login` — admin login (role: admin)
- `/admin` — admin dashboard (platform-wide metrics)
- `/admin/tenants` — tenant list (all DMC accounts)
- `/admin/tenants/[id]` — tenant detail + edit + suspend
- `/admin/proxy` — Proxy Pool Management (master credentials, sub-user pool, rotation policy)
- `/admin/workers` — Worker health + job queue
- `/admin/ota` — OTA platform registry + parser versions

---

## Layer 3 — Backend API (Phase 3 — TODO)

Built with **FastAPI** (Python).

### Endpoints to Build
- `POST /auth/login` → JWT with role (`dmc` | `admin`)
- `POST /auth/invite` → signed invite email
- `GET|POST|PUT|DELETE /packages`
- `POST /audits` → triggers scraper job
- `WS /audits/{run_id}/logs` → real-time log stream to stepper UI
- `GET /reports/{run_id}` → matched components + deltas
- `POST /reports/{run_id}/export-pdf`
- `GET|POST|PATCH /admin/tenants`
- `GET|PUT /admin/proxy/config` → master Torch Labs credentials (admin only)
- `GET /admin/workers`
- `GET /admin/usage`

---

## Layer 4 — Scraper Workers (Phase 4 — TODO)

Containerized Python services using Playwright + Celery + Redis.

- `booking_scraper.py` — residential proxy → listing search
- `agoda_scraper.py` — ISP proxy → sticky room-detail session
- `expedia_scraper.py`
- `viator_scraper.py`
- `embedder.py` — BGE-M3 cosine similarity
- `llm_verifier.py` — Gemini equivalence check
- `report_compiler.py` — delta calculation + leakage flagging

---

## Layer 5 — Database (Phase 3 — TODO)

PostgreSQL with Alembic migrations.

| Table | Purpose |
|-------|---------|
| `tenants` | DMC companies, plan tier, status |
| `users` | Accounts linked to a tenant |
| `packages` | Itinerary JSON + cost data |
| `audit_runs` | Each triggered run: status, config snapshot |
| `audit_logs` | Streaming terminal log lines |
| `matched_components` | Scraped matches + confidence scores |
| `reports` | Final compiled report per run |
| `proxy_config` | Master Torch Labs credentials (admin-managed) |
| `proxy_sessions` | Sub-user pool: IP, market zone, health |
| `notifications` | Per-tenant alert records |
| `usage_events` | Raw usage for billing |

---

## Priority Build Order

| Priority | What |
|----------|------|
| **P0** | FastAPI skeleton + JWT auth + DB schema |
| **P0** | Audit API + WebSocket log stream |
| **P1** | Scraper workers (Booking.com + Agoda first) |
| **P1** | Admin: Proxy config editor (wire to DB) |
| **P2** | Admin: Tenant management |
| **P2** | DMC: Auth + workspace settings |
| **P3** | Notifications service |
| **P3** | Billing / usage tracking |
