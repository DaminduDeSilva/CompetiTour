# CompetiTour — Refined Implementation Plan

**Team ZeroTrace · {PROXY}Maze'26 · Track 4: Vertical Intelligence Layer**
**Build window: Jun 22 – Jul 12, 2026 (21 days)**

---

## 1. MVP Scope Lock (Hold the Line)

| # | Deliverable | Owner |
|---|---|---|
| 1 | Proxy-integrated travel data collection | Scraping/Proxy |
| 2 | Source-market package monitoring | Scraping/Proxy + Backend |
| 3 | AI-powered itinerary matching | AI/Matching |
| 4 | Competitiveness reporting | Backend + Frontend |
| 5 | Historical comparison capability | Backend (Postgres snapshots) |
| 6 | Basic dashboard and report generation | Frontend |

**Explicitly out of scope**: flight pricing, direct OTA integrations, automated pricing recommendations, real-time monitoring across all platforms, data warehouse layer. Don't let scope creep — judges reward a tight, working MVP over a half-built ambitious one.

---

## 2. Project Folder Structure

```
CompetiTour/
├── docker-compose.yml              # All services orchestration
├── docker-compose.dev.yml          # Dev overrides (hot reload, volumes)
├── .env.example                    # Template — NEVER commit real .env
├── .gitignore
├── README.md
├── Makefile                        # Shortcuts: make up, make migrate, make seed
│
├── backend/                        # Python — FastAPI + Workers
│   ├── Dockerfile
│   ├── pyproject.toml              # Single Python project (poetry/uv)
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/              # Auto-generated migration files
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app factory + lifespan
│   │   ├── config.py              # Pydantic Settings (env vars)
│   │   ├── database.py            # SQLAlchemy async engine + session
│   │   │
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── source_market.py
│   │   │   ├── dmc_package.py
│   │   │   ├── package_component.py
│   │   │   ├── ota_platform.py
│   │   │   ├── scrape_session.py
│   │   │   ├── ota_listing.py
│   │   │   ├── component_match.py
│   │   │   ├── competitiveness_report.py
│   │   │   └── user.py
│   │   │
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── package.py
│   │   │   ├── report.py
│   │   │   ├── job.py
│   │   │   └── auth.py
│   │   │
│   │   ├── api/                   # Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── deps.py            # Dependency injection (db session, auth)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py      # Aggregates all v1 routes
│   │   │       ├── packages.py
│   │   │       ├── reports.py
│   │   │       ├── jobs.py
│   │   │       ├── dashboard.py
│   │   │       └── auth.py
│   │   │
│   │   ├── services/              # Business logic (no HTTP awareness)
│   │   │   ├── __init__.py
│   │   │   ├── package_service.py
│   │   │   ├── analysis_service.py    # Orchestrates scrape → match → report
│   │   │   ├── report_service.py
│   │   │   └── export_service.py      # PDF/CSV generation
│   │   │
│   │   └── core/                  # Cross-cutting concerns
│   │       ├── __init__.py
│   │       ├── security.py        # JWT, password hashing
│   │       └── exceptions.py
│   │
│   ├── workers/                   # Background task workers
│   │   ├── __init__.py
│   │   ├── worker.py              # ARQ worker entry point
│   │   ├── tasks/
│   │   │   ├── __init__.py
│   │   │   ├── scrape_task.py     # Dispatches per-platform scraper
│   │   │   ├── match_task.py      # Runs AI matching pipeline
│   │   │   └── report_task.py     # Generates competitiveness report
│   │   │
│   │   ├── scrapers/              # Per-platform Playwright scrapers
│   │   │   ├── __init__.py
│   │   │   ├── base_scraper.py    # Abstract: launch browser, proxy, stealth
│   │   │   ├── booking_scraper.py
│   │   │   ├── agoda_scraper.py
│   │   │   ├── expedia_scraper.py
│   │   │   └── viator_scraper.py
│   │   │
│   │   ├── proxy/                 # Torch Labs proxy management
│   │   │   ├── __init__.py
│   │   │   ├── manager.py         # get_proxy_config(), session rotation
│   │   │   └── health.py          # Proxy validation + IP geo-check
│   │   │
│   │   └── matching/              # AI itinerary matching pipeline
│   │       ├── __init__.py
│   │       ├── embeddings.py      # Sentence-transformers encoding
│   │       ├── llm_verifier.py    # Gemini API equivalence verification
│   │       ├── normalizer.py      # Price normalization, FX rates
│   │       └── scorer.py          # Competitiveness score calculation
│   │
│   ├── scripts/                   # One-off utility scripts
│   │   ├── seed_markets.py        # Seed DE, GB source markets
│   │   ├── seed_platforms.py      # Seed OTA platform configs
│   │   └── seed_demo_packages.py  # Demo packages for judging
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_api/
│       ├── test_scrapers/
│       └── test_matching/
│
├── frontend/                      # Next.js 14+ (App Router)
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   │
│   ├── public/
│   │   └── logo.svg
│   │
│   ├── src/
│   │   ├── app/                   # App Router pages
│   │   │   ├── layout.tsx         # Root layout + global providers
│   │   │   ├── page.tsx           # Landing / redirect to dashboard
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Overview cards, alerts, package list
│   │   │   │
│   │   │   ├── packages/
│   │   │   │   ├── page.tsx       # Package list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # Create/import package
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Package detail + components
│   │   │   │       └── analyze/
│   │   │   │           └── page.tsx  # Trigger analysis, job progress
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Competitiveness report view
│   │   │   │       └── history/
│   │   │   │           └── page.tsx  # Historical trend charts
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx       # Markets & platform config
│   │   │
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/                # Primitives (Button, Card, Badge, etc.)
│   │   │   ├── layout/            # Sidebar, TopBar, PageWrapper
│   │   │   ├── packages/          # PackageCard, ComponentTable
│   │   │   ├── reports/           # DeltaBadge, CompetitivenessChart
│   │   │   └── dashboard/         # SummaryCard, AlertList
│   │   │
│   │   ├── lib/                   # Utilities
│   │   │   ├── api.ts             # Axios/fetch wrapper for FastAPI
│   │   │   ├── types.ts           # TypeScript interfaces matching Pydantic
│   │   │   └── utils.ts           # Formatting, currency helpers
│   │   │
│   │   └── hooks/                 # Custom React hooks
│   │       ├── usePackages.ts
│   │       ├── useReports.ts
│   │       └── useJobPolling.ts   # Poll job status with backoff
│   │
│   └── tests/
│
├── nginx/                         # Reverse proxy (optional, for prod demo)
│   └── default.conf
│
├── scripts/                       # Project-level scripts
│   ├── init-db.sh                 # Wait for PG + run migrations + seed
│   └── demo-setup.sh              # Full demo reset script
│
└── docs/
    ├── architecture.md
    ├── api-reference.md
    └── proxy-setup.md
```

---

## 3. System Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│  Next.js     │◄────►│   FastAPI (API)   │◄────►│   PostgreSQL        │
│  Dashboard   │ REST │   - auth          │      │   - packages        │
│  :3000       │      │   - packages CRUD │      │   - ota_listings    │
└─────────────┘      │   - jobs/reports  │      │   - price_snapshots │
                      └────────┬──────────┘      │   - matches/reports │
                               │ enqueue          └─────────────────────┘
                               ▼
                      ┌──────────────────┐
                      │   Redis (queue)   │
                      │   :6379           │
                      └────────┬──────────┘
                               ▼
                ┌──────────────────────────────┐
                │   ARQ Worker Pool (2-3)       │
                │  ┌─────────────┐ ┌──────────┐│
                │  │ Playwright   │ │ Matching ││
                │  │ Scrape Jobs  │ │ Jobs     ││
                │  │ (per market) │ │(Gemini + ││
                │  └──────┬──────┘ │ Embed)   ││
                │         │        └──────────┘│
                └─────────┼────────────────────┘
                          ▼
                ┌──────────────────────┐
                │  Torch Labs Proxies   │
                │  (Residential + ISP)  │
                └──────────┬────────────┘
                           ▼
              Booking.com · Agoda · Expedia · Viator
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Task queue | **ARQ** (not Celery) | Native async Python, tiny footprint, Redis-only — perfect for hackathon scope |
| ORM | **SQLAlchemy 2.0 async** | Typed models, async-first, Alembic migrations built-in |
| Browser stealth | **playwright-stealth** | Masks `navigator.webdriver`, spoofs fingerprints against OTA anti-bot |
| Embeddings | **BGE-M3** (primary) or `paraphrase-multilingual-mpnet-base-v2` (fallback) | BGE-M3 is SOTA for multilingual retrieval; mpnet is proven and lighter |
| LLM | **Gemini Flash 1.5** default, **Pro** for ambiguous cases | Cost-effective at scrape volume; escalation only for edge cases |
| Frontend | **Next.js 14 App Router** | Server components for initial data fetch, client for interactivity |

### Docker Compose Services

```yaml
services:
  postgres:    # Port 5432, persistent volume
  redis:       # Port 6379
  api:         # FastAPI on :8000, depends on postgres + redis
  worker:      # ARQ worker, scaled to 2-3 replicas, has Playwright + proxy creds
  frontend:    # Next.js on :3000, proxies /api to api service
```

All secrets (Torch Labs creds, Anthropic API key, JWT secret) live in `.env`, injected into `api` and `worker` containers only. Frontend never touches them.

---

## 4. Database Schema (PostgreSQL + Alembic)

Core tables from the original plan, with these refinements:

```sql
-- Source markets (Germany, UK, etc.)
CREATE TABLE source_markets (
    id SERIAL PRIMARY KEY,
    country_code CHAR(2) NOT NULL,
    country_name TEXT NOT NULL,
    currency CHAR(3) NOT NULL,
    locale TEXT NOT NULL,
    timezone TEXT NOT NULL
);

-- DMC packages
CREATE TABLE dmc_packages (
    id SERIAL PRIMARY KEY,
    dmc_account_id INT NOT NULL,
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    duration_days INT NOT NULL,
    total_price_lkr NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active'
);

-- Package components (hotels, transfers, excursions)
CREATE TABLE package_components (
    id SERIAL PRIMARY KEY,
    package_id INT REFERENCES dmc_packages(id) ON DELETE CASCADE,
    component_type TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    nights_or_duration TEXT,
    base_price_lkr NUMERIC(12,2),
    notes TEXT
);

-- OTA platforms being monitored
CREATE TABLE ota_platforms (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    scrape_config JSONB  -- selectors, search params, per-platform quirks
);

-- Scrape audit trail
CREATE TABLE scrape_sessions (
    id SERIAL PRIMARY KEY,
    platform_id INT REFERENCES ota_platforms(id),
    source_market_id INT REFERENCES source_markets(id),
    proxy_session_id TEXT,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_log TEXT
);

-- Scraped OTA listing data (also serves as historical time series)
CREATE TABLE ota_listings (
    id SERIAL PRIMARY KEY,
    scrape_session_id INT REFERENCES scrape_sessions(id),
    platform_id INT REFERENCES ota_platforms(id),
    source_market_id INT REFERENCES source_markets(id),
    component_type TEXT NOT NULL,
    raw_name TEXT NOT NULL,
    raw_description TEXT,
    price NUMERIC(12,2),
    currency CHAR(3),
    price_usd NUMERIC(12,2),
    url TEXT,
    captured_at TIMESTAMPTZ DEFAULT now()
);

-- AI-generated matches
CREATE TABLE component_matches (
    id SERIAL PRIMARY KEY,
    package_component_id INT REFERENCES package_components(id),
    ota_listing_id INT REFERENCES ota_listings(id),
    confidence NUMERIC(5,2),
    match_method TEXT,
    reviewed BOOLEAN DEFAULT FALSE
);

-- Competitiveness reports
CREATE TABLE competitiveness_reports (
    id SERIAL PRIMARY KEY,
    package_id INT REFERENCES dmc_packages(id),
    source_market_id INT REFERENCES source_markets(id),
    dmc_price_usd NUMERIC(12,2),
    market_assembled_price_usd NUMERIC(12,2),
    price_delta_pct NUMERIC(6,2),
    status TEXT,
    generated_at TIMESTAMPTZ DEFAULT now()
);

-- NEW: Job tracking for async task status in the API
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id INT REFERENCES dmc_packages(id),
    source_market_ids INT[] NOT NULL,
    status TEXT DEFAULT 'queued',
    total_tasks INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error_log TEXT
);

-- Performance indexes
CREATE INDEX idx_ota_listings_captured ON ota_listings(captured_at);
CREATE INDEX idx_ota_listings_market ON ota_listings(source_market_id, platform_id);
CREATE INDEX idx_component_matches_pkg ON component_matches(package_component_id);
CREATE INDEX idx_reports_package ON competitiveness_reports(package_id, generated_at DESC);
```

The `analysis_jobs` table bridges async ARQ workers and frontend polling. The `/jobs/{id}` endpoint reads this table for progress bars.

`ota_listings` doubles as your historical time series — every scrape writes new rows with `captured_at`, so trend charts are just `GROUP BY date` queries.

---

## 5. Proxy & Scraping Layer

### 5.1 Torch Labs Integration

Proxy credentials are generated via the **Torch Labs Dashboard** (My Products → Residential Proxies → Generation). Create a sub-user first, then generate endpoints with geo-targeting and session options.

```python
# backend/workers/proxy/manager.py
import os, uuid
from app.config import settings

def get_proxy_config(country_code: str, sticky: bool = True) -> dict:
    """Build Playwright-compatible proxy config for Torch Labs."""
    session_id = uuid.uuid4().hex[:8]
    password = settings.TORCH_PASSWORD

    if sticky:
        password = f"{password}:country-{country_code.lower()}:session-{session_id}"
    else:
        password = f"{password}:country-{country_code.lower()}"

    return {
        "server": f"http://{settings.TORCH_GATEWAY_HOST}:{settings.TORCH_GATEWAY_PORT}",
        "username": settings.TORCH_USERNAME,
        "password": password,
    }
```

### 5.2 Base Scraper Pattern

```python
# backend/workers/scrapers/base_scraper.py
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

class BaseScraper:
    async def create_context(self, proxy_config, locale, timezone):
        pw = await async_playwright().start()
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            proxy=proxy_config,
            locale=locale,
            timezone_id=timezone,
            extra_http_headers={"Accept-Language": locale},
        )
        page = await context.new_page()
        await stealth_async(page)
        return pw, browser, context, page
```

### 5.3 Proxy Mode Selection

| Job Type | Proxy Mode | Why |
|---|---|---|
| Multi-step itinerary build | **Sticky residential** | Same visitor throughout session |
| Broad hotel/excursion sweeps | **Rotating residential** | Spread load, avoid rate limits |
| Long pagination runs (Viator) | **ISP proxy** | Fast, stable, avoids churn detection |

### 5.4 Per-Platform Approach

| Platform | What to Scrape | Notes |
|---|---|---|
| Booking.com | Hotel search results + price for given dates/destination | Geo + currency follows proxy; add explicit locale query param |
| Agoda | Hotel search results + price | Strong geo-based pricing variance — good showcase |
| Expedia | Hotel + package bundle pricing | Bundled package flows for direct comparison |
| Viator | Excursion/activity pricing | Maps to "excursion" component type |

### 5.5 Resilience Practices

- Selectors stored in `ota_platforms.scrape_config` (JSONB) — layout change = config update, not code deploy
- Rate-limit per session; exponential backoff + rotate proxy on repeated failures
- CAPTCHA/hard block → mark `scrape_session.status = 'blocked'`, retry with fresh sticky session
- Only scrape publicly viewable search pages. Persist structured facts only (price, name, dates) — don't republish OTA photos/descriptions

---

## 6. AI Itinerary Matching Pipeline

This is the core differentiator judges will scrutinize.

### Pipeline Steps

1. **Normalize** — Strip marketing language from both DMC components and OTA listings. Extract structured fields (hotel brand, star rating, room type, location, board basis; excursion name, duration, inclusions).

2. **Candidate Retrieval (Embeddings)** — Generate sentence embeddings using BGE-M3 (multilingual, 50+ languages) via `sentence-transformers`. Retrieve top-5 candidates per DMC component by cosine similarity, filtered to same destination + component type.

3. **Equivalence Verification (LLM)** — Pass DMC component + top-5 candidates to Gemini Flash 1.5 with structured prompt. Returns JSON array with confidence score (0-100) and justification. Escalate ambiguous cases (confidence 40-70) to Gemini Pro for second pass.

4. **Price Normalization** — Convert all prices to USD using daily FX rate table. Apply rule-based adjustments for inclusions (breakfast, taxes, transfers) for like-for-like comparison.

5. **Package Aggregation** — Sum matched component prices into "market-assembled price" and compare to DMC package price.

### Matching Prompt

```python
MATCH_PROMPT = """You are comparing a travel package component to candidate listings
from online travel platforms. Score how likely each candidate is the SAME
hotel/excursion as the reference component (not just similar category).

Reference component:
{component_json}

Candidates:
{candidates_json}

Return ONLY a JSON array: [{{"candidate_id": ..., "confidence": 0-100, "reason": "..."}}]
"""
```

### Competitiveness Score

```
price_delta_pct = (dmc_price_usd - market_assembled_price_usd) / market_assembled_price_usd × 100
```

| Delta | Status |
|---|---|
| ±5% | ✅ Competitive |
| +5% to +15% | ⚠️ At Risk |
| > +15% | 🔴 Margin Leakage |
| < −10% | 💡 Underpriced (opportunity) |

Thresholds are configurable per DMC.

---

## 7. Backend API (FastAPI)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/packages` | Create/import DMC package + components |
| GET | `/api/v1/packages/{id}` | Package detail |
| POST | `/api/v1/packages/{id}/analyze` | Trigger monitoring run for source markets |
| GET | `/api/v1/jobs/{job_id}` | Poll job status + progress |
| GET | `/api/v1/packages/{id}/reports` | List reports for a package |
| GET | `/api/v1/reports/{id}` | Single competitiveness report |
| GET | `/api/v1/reports/{id}/export?format=pdf\|csv` | Downloadable report |
| GET | `/api/v1/packages/{id}/history?market=DE` | Time-series for trend chart |
| GET | `/api/v1/dashboard/summary` | Dashboard overview cards |
| POST | `/api/v1/auth/login` | Authentication |
| POST | `/api/v1/auth/register` | Registration |

`POST /packages/{id}/analyze` is the core action: enqueues scrape tasks per (platform × market × component) onto Redis → ARQ workers process via Playwright + Torch Labs proxies → matching task runs after scrapes complete → report-generation task writes `competitiveness_reports` row.

---

## 8. Frontend (Next.js)

| Route | Purpose |
|---|---|
| `/dashboard` | Overview cards, recent alerts, package list |
| `/packages/new` | Create/import package (manual entry first; CSV as stretch) |
| `/packages/[id]` | Package detail + components table |
| `/packages/[id]/analyze` | Select source markets, trigger run, see job progress |
| `/reports/[id]` | Competitiveness report: headline delta, component breakdown |
| `/reports/[id]/history` | Trend chart over time for package/market |
| `/settings` | Manage source markets & platform config |

Keep v1 forms simple (manual entry). CSV/PDF import is secondary — don't let it eat sprint time meant for the AI pipeline.

---

## 9. Sprint Plan — Jun 22 to Jul 12

### Role Assignments

| Member | Domain | Owns |
|---|---|---|
| W. D. T. De Silva | Backend & API | FastAPI, Postgres, Alembic, job orchestration |
| S. B. Wickramanayake | Scraping & Proxy | Playwright scrapers, Torch Labs integration, stealth |
| E. K. K. D. R. Edirisinghe | AI/Matching | Embeddings, Gemini integration, scoring logic |
| J. P. T. S. Jayasinghe | Frontend + Demo | Next.js dashboard, report views, demo polish |

### Week 1 (Jun 22–28) — Foundations

- [ ] Repo scaffold with full folder structure, Docker Compose working
- [ ] Postgres schema migrated via Alembic, seed scripts for markets + platforms
- [ ] Torch Labs account set up, proxy auth confirmed (`curl` + Playwright → `httpbin.org/ip`)
- [ ] One platform (Booking.com) scraped for one market (DE), raw data in `ota_listings`
- [ ] FastAPI skeleton with `/packages` CRUD live
- [ ] Next.js shell with sidebar, dashboard mock data

**Checkpoint Jun 28**: End-to-end happy path on one platform/one market, even if ugly.

### Week 2 (Jun 29–Jul 5) — Core Pipeline

- [ ] Remaining 3 platforms wired (Agoda, Expedia, Viator)
- [ ] Second source market (GB) added, locale/currency verified
- [ ] Embedding-based candidate retrieval tested against real scraped data
- [ ] Gemini equivalence verification wired, confidence scoring working
- [ ] Competitiveness score + report generation endpoint
- [ ] Frontend: package creation, analyze trigger, report view (real data)

**Checkpoint Jul 5**: Full pipeline runs for a real package across both markets, produces report in UI.

### Week 3 (Jul 6–12) — Hardening & Demo

- [ ] Historical trend view (schedule daily runs from Jul 6 for real trend data)
- [ ] Error handling, retry/backoff, low-confidence match review
- [ ] Report export (PDF/CSV)
- [ ] UI polish, seed 2-3 realistic demo packages
- [ ] Dry-run demo script twice; prepare fallback pre-captured dataset
- [ ] Submit by Jul 12

---

## 10. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Anti-bot blocks mid-demo | Sticky sessions + stealth; pre-captured fallback dataset for live demo |
| Platform layout changes | Selectors in DB config (JSONB), not hardcoded — swap without redeploying |
| Matching accuracy questioned | Hand-labeled validation set (~30 component/listing pairs), show precision/recall |
| Proxy quota burned during testing | Cap scrape frequency during dev; reserve quota for demo day |
| Scope creep | Hold the line at 6 MVP deliverables |

---

## 11. Demo Day Checklist

- [ ] Live (or fallback) scrape run completes for ≥1 package, both markets
- [ ] Competitiveness report renders with clear price delta + status badge
- [ ] At least one historical trend chart with real multi-day data
- [ ] Report export works (PDF or CSV)
- [ ] Short demo script: problem → proxy insight → AI matching → business value
- [ ] `docker compose up` works from clean clone for judges

---

## 12. Open Questions for Team

1. **Torch Labs credentials** — Has the team received dashboard access and created sub-users? Gateway hostname/port are dashboard-generated — needed before Week 1 coding.
2. **Google API key** — Do you have Gemini API access, or should we plan an OpenAI fallback?
3. **Demo environment** — Will judges run `docker compose up` locally, or need hosted deployment (Railway/Render)?
4. **Embedding model size** — BGE-M3 is better but ~2.3GB. Is worker container size a concern for demo?
