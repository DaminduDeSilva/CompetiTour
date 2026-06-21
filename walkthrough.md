# CompetiTour — Video Demo Guide

## What Was Built (19 Routes Total)

| Route | Type | What it shows |
|-------|------|--------------|
| `/` | Landing | 3D globe, hero pitch, partner logos |
| `/login` | DMC Auth | Email/password login → redirects to dashboard |
| `/dashboard` | DMC | Package metrics, trend chart, market indicators |
| `/packages` | DMC | Package list with search, filter, status badges |
| `/packages/new` | DMC | Package creation form with audit config |
| `/packages/[id]` | DMC | Package detail, editable fields, itinerary breakdown |
| `/packages/[id]/analyze` | DMC | Live audit stepper with dual-proxy logs |
| `/reports` | DMC | All audit runs, filterable table |
| `/reports/[id]/history` | DMC | Component-level report + historical log |
| `/notifications` | DMC | Dismissible alert feed |
| `/settings` | DMC | 3-tab settings (Workspace / AI Matcher / Proxy Status) |
| `/admin/login` | Admin | Admin-only login with red branding |
| `/admin` | Admin | Platform overview, metrics, activity feed |
| `/admin/tenants` | Admin | All DMC tenant accounts |
| `/admin/tenants/[id]` | Admin | Tenant detail, plan editor, usage bar |
| `/admin/proxy` | Admin | Master credentials editor + sub-user pool table |
| `/admin/workers` | Admin | Live worker cards with CPU/memory bars + job queue |
| `/admin/ota` | Admin | OTA platform registry, parser versions, toggle |

---

## Recommended Recording Flow

### Part 1 — Landing & DMC Onboarding (≈ 90 seconds)

**1. Open `http://localhost:3000`**
- Let the 3D globe load and animate
- Say: *"CompetiTour is ZeroTrace's AI-powered pricing intelligence layer for Sri Lankan DMCs"*
- Click a country ring on the globe (Germany, UK, or Australia) to show the flight animation

**2. Scroll down the landing page**
- Point to the three value-prop cards: Geo-targeted scraping → AI Matching → Margin analysis
- Point to the partner logos section

**3. Click "Go to Dashboard" or navigate to `/login`**
- Show the login screen — credentials are pre-filled
- Click **Sign In** — it animates for ~1.2s then lands on Dashboard

---

### Part 2 — DMC Portal (≈ 3 minutes)

**4. Dashboard (`/dashboard`)**
- Point to the 4 metric cards: Competitive Ratio 50%, At Risk 1, Leakage 1, Scrapes 1,420 (98.4%)
- Highlight the Proxy Active + AI Matcher Idle badges in the top bar
- Say: *"The dashboard gives the DMC a live view of which packages need attention"*

**5. Packages List (`/packages`)**
- Click **Packages** in the sidebar
- Show the full list — 5 packages, different status badges
- Filter by **Leakage** — shows Adventure & Wildlife Safari
- Click **View** on it

**6. Package Detail (`/packages/3`)**
- Point to the itinerary breakdown: Cinnamon Wild Yala, Cape Weligama, Safari, Transfers
- Total DMC cost: €5,660
- Point to the At Risk warning card
- Click **Edit Package** — fields become editable
- Click **Save Changes**
- Click **Run Audit →**

**7. Audit Stepper (`/packages/3/analyze`)**
- Watch the 5 steps animate:
  - **Step 1** — Dual-proxy sessions: *"Premium Residential for anti-bot evasion, ISP for sticky session"*
  - **Step 2** — Booking.com + Agoda scraping via Playwright
  - **Step 3** — BGE-M3 cosine similarity matching (0.942)
  - **Step 4** — Claude LLM equivalence verification (98.4% confidence)
  - **Step 5** — Gap: €7,120 market vs €5,660 DMC = **-20.5% Leakage**
- Notice **AI Matcher: Running Audit** in the top bar (amber, bouncing)
- Click **View Competitiveness Report**

**8. Report (`/reports/3/history`)**
- Package header visible: *"Adventure & Wildlife Safari — 12 Days · LKR 1,850,000"*
- **AI Pricing Gap & Margin Analysis** card — shows gap, not a direct price prescription
- Component table — 4 matched items with confidence scores
- Click **Simulate Target Price Adjustment** → button turns to ✓ Target Price Simulated
- Scroll to **Historical Audit Logs** — 3 past runs (DE, GB, AU all showing Leakage)
- Click **View Snapshot** on any row

**9. Reports Index (`/reports`)**
- Click **Reports** in sidebar — shows all 7 audit runs across packages
- Filter by **At Risk** — 2 results
- Filter back to **All**

**10. Notifications (`/notifications`)**
- Click **Notifications** in sidebar (or click the bell dropdown → View all)
- Show 7 alerts with coloured icons (blue = leakage, yellow = at risk, green = complete)
- Dismiss one notification
- Click **Mark all as read**

**11. Settings (`/settings`)**
- Click **Settings**
- Tab: **Workspace** — company name, notification threshold slider, email/in-app toggles, plan info (read-only)
- Tab: **AI Matcher** — model selector (Claude Haiku/Sonnet/BGE-M3 only), confidence threshold
- Tab: **Proxy Status** — read-only display: *"Managed by ZeroTrace"*, live session IPs, success rates
- Say: *"DMC subscribers see the connection status but cannot edit gateway credentials — that's handled at the admin level"*

---

### Part 3 — Admin Console (≈ 2 minutes)

**12. Navigate to `/admin/login`**
- Show the red-themed admin login screen
- Pre-filled: `admin@zerotrace.io`
- Click **Access Admin Console**

**13. Admin Dashboard (`/admin`)**
- Point to: 4 Active Tenants, 5,842 Proxy Sessions, 8 Workers, 23 Audit Runs
- Say: *"This is what ZeroTrace sees — platform-wide visibility across all DMC subscribers"*
- Show the live activity feed (Horizon DMC, Jetwing, Walkers)

**14. Tenant Management (`/admin/tenants`)**
- Show all 4 DMC accounts — Enterprise and Standard tiers
- Note: Cinnamon Holidays is Suspended
- Click **Manage** on Horizon DMC → `/admin/tenants/t-001`
- Change Plan Tier from Standard to Enterprise
- Point to the usage bar (46% of limit used)
- Click **Save Changes**
- Back to tenant list

**15. Proxy Pool Management (`/admin/proxy`) ← Key differentiator**
- Say: *"This is where ZeroTrace actually manages Torch Labs credentials — completely invisible to DMC subscribers"*
- Show the editable master credentials form: gateway host, port, master user, password
- Point to rotation policy: Residential rotates every 15 requests, ISP every 30
- Scroll to **Sub-user Pool table** — 6 rows
- Point to the two types: **Residential** (purple) and **ISP Sticky** (amber)
- Say: *"Residential proxies handle initial search queries to beat Cloudflare. ISP proxies hold stable sessions for room-detail and pricing extraction. This dual-proxy approach is what makes the scraper reliable against enterprise anti-bot systems"*

**16. Worker Health (`/admin/workers`)**
- Show 6 worker cards — 3 busy (CPU bars animating live), 2 idle, 1 error
- Point to the crashed worker → click **Restart**
- Scroll to job queue — 3 jobs (2 queued, 1 running)
- Click **Cancel** on a queued job

**17. OTA Platforms (`/admin/ota`)**
- Show 4 platforms with bot risk badges (Booking = High, Viator = Low)
- Point to Expedia's **Degraded** status: *"Schema changed, parser update in progress"*
- Edit a parser version number
- Toggle a platform off/on
- Click **Save Platform Config**

---

## Key Talking Points Per Section

| Screen | What to emphasise |
|--------|------------------|
| Globe | *"Geo-targeted: the exit IP determines what price the scraper sees"* |
| Audit Step 1 | *"Two separate proxy connections — each serves a distinct purpose"* |
| Audit Step 4 | *"Claude LLM verifies room tier and cancellation policy equivalence — not just name matching"* |
| Report header | *"Package name, duration, and base rate are always visible — never floating data"* |
| Report gap card | *"We show the gap, not a prescription. The DMC decides whether to reprice"* |
| Settings / Proxy tab | *"The DMC sees their connection status — ZeroTrace manages the actual credentials"* |
| Admin / Proxy page | *"This is the actual credential form — admin-only, never exposed to subscribers"* |
| Admin / Workers | *"Real-time worker health — the team can see exactly what's running and cancel jobs"* |

---

## Demo Tips

> [!TIP]
> Start the video at `/login` or the landing page `/` — not directly at `/dashboard`. The login flow shows the product has proper auth.

> [!TIP]
> When showing the audit stepper, use a screen width of ~1280px so the terminal logs and the step progress bar are both visible simultaneously.

> [!TIP]
> Demonstrate the bell dropdown in the TopBar before going to the full Notifications page — it shows the real-time alerting concept cleanly in one click.

> [!TIP]
> On the Admin Proxy page, zoom in on the sub-user pool table when explaining the dual-proxy architecture. The Residential/ISP colour coding (purple vs amber) makes the distinction visually clear.

> [!IMPORTANT]
> The audit stepper auto-completes in ~15 seconds. Start the screen recording *before* clicking Run Audit so the full animation is captured.

> [!NOTE]
> All data is consistent end-to-end: Dashboard (package 3 → DE → -20.5%) matches the audit logs (€7,120 vs €5,660) matches the report component table (same itemised prices) matches the historical log (June 21, -20.5%).

---

## All URLs for Quick Navigation During Recording

```
http://localhost:3000/           ← Landing page
http://localhost:3000/login      ← DMC login
http://localhost:3000/dashboard  ← DMC dashboard
http://localhost:3000/packages   ← Package list
http://localhost:3000/packages/3 ← Adventure & Wildlife Safari detail
http://localhost:3000/packages/3/analyze  ← Audit stepper
http://localhost:3000/reports/3/history  ← Competitiveness report
http://localhost:3000/reports    ← All reports index
http://localhost:3000/notifications ← Alert feed
http://localhost:3000/settings   ← Settings (3 tabs)
http://localhost:3000/admin/login      ← Admin login
http://localhost:3000/admin            ← Admin dashboard
http://localhost:3000/admin/tenants    ← Tenant list
http://localhost:3000/admin/tenants/t-001 ← Horizon DMC detail
http://localhost:3000/admin/proxy      ← Proxy Pool Management
http://localhost:3000/admin/workers    ← Worker health + job queue
http://localhost:3000/admin/ota        ← OTA platform registry
```
