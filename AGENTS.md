# AGENTS.md — MMPI Psikolojik Test Sistemi

## Project overview
Vanilla HTML/CSS/JS single-page app (no bundler, no framework, no build step). MMPI-2 psychological test with optional Supabase backend. Turkish language throughout. Served via any static file server.

## Key directories
- `/` — Root HTML pages: `index.html` → `personal-info.html` → `kvkk-consent.html` → `mmpi-test.html` → `test-complete.html` → `report.html`
- `assets/js/` — All JS logic (no modules, global namespace via `window`)
- `assets/css/` — Single `style.css`
- `admin/` — Admin panel (login, dashboard, reports, results, settings)
- `belgeler/` & `dokumanlar/` — SQL migrations, test data, documentation

## Script load order (critical)
In every HTML page, scripts are loaded in this specific order:
1. Bootstrap + jQuery (CDN)
2. `test-config.js` — global config object
3. `mmpi-scoring.js` — scoring engine
4. **`pg-config.js`** — PostgreSQL API client (replaces Supabase JS CDN)
5. `supabase-config.js` — now a **compat wrapper** delegating to `pg-config.js` (will be removed eventually)
6. Page-specific JS (e.g. `mmpi-test.js`, `personal-info.js`)

**DO NOT change this order** — scripts depend on globals set by earlier ones.

## Environment & Server Details

| Service | Hostname | Port | Public URL |
|---|---|---|---|
| **PostgreSQL** | `postgres_db` | 5432 | — |
| **PostgREST** (internal) | `postgrest` | 3000 | `https://selma-api.ozguryilmaz.com.tr` |
| **Web App** (static files) | served via nginx + Cloudflare Tunnel | 80/443 | `https://selma-psikoloji.ozguryilmaz.com.tr` |

- Browser calls PostgREST directly at `https://selma-api.ozguryilmaz.com.tr` (no nginx proxy)
- `pg-config.js` switches URL based on hostname: dev → `http://postgrest:3000`, prod → `https://selma-api.ozguryilmaz.com.tr`
- `postgrest.conf` has `cors-origin = "*"` to allow cross-origin requests from the web app

## Backend (PostgreSQL + PostgREST)
- Supabase has been **replaced** with direct PostgreSQL via **PostgREST** (a standalone REST API server that turns PostgreSQL into a REST API — no custom backend code)
- `pg-config.js` provides `window.PG_API` (generic CRUD via `fetch` to PostgREST) and `window.AuthService` (JWT auth via `/rpc/login` database function)
- `window.supabase = window.PG_API` for backward compat — all existing `supabase.from()` calls work unchanged
- **No custom API server** — PostgREST is a single binary, no Node.js required

### Database (hostname: `postgres_db`)
- Schema: `database/01_schema.sql` — all tables + indexes + triggers + `pgcrypto` extension
- Data: `database/02_data.sql` — imports questions (1–100), scoring keys, T-score params, interpretations, KVKK, page content, settings
- Admin setup: `database/03_setup_admin.sql` — instructions for password hashing
- PostgREST setup: `database/05_postgrest_setup.sql` — database roles (`anon`/`authenticated`), `api.login()` function (JWT signing via pgcrypto hmac), `api.me()` function, grants
- Run order: `01_schema.sql` → `02_data.sql` → (generate bcrypt hashes, update users) → `05_postgrest_setup.sql`

### PostgREST
- Config: `postgrest.conf` — connects to `postgres_db:5432`, exposes `public` + `api` schemas
- Listens on port 3000, `db-anon-role = anon`, `jwt-secret` configured
- Public URL: `https://selma-api.ozguryilmaz.com.tr`
- Login flow: `POST /rpc/login {email, password}` → JWT string (verified by `api.login()` DB function)
- All data CRUD: `GET/POST/PATCH/DELETE /table_name?col=eq.value`
- Auth: JWT `role` claim tells PostgREST which DB role to use (anon vs authenticated)
- Start: `postgrest postgrest.conf`

### Key changes in HTML
- Removed `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">` from all 22 pages
- Added `<script src="assets/js/pg-config.js"></script>` before supabase-config.js
- **Note**: `assets/js/debug.js` and `admin/js/settings.js` were updated to remove `supabase.auth` calls

## Running the app
```sh
# Local dev — any static file server works:
python3 -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

## Production deployment
- **nginx** on port 80 serves the static files from this directory
- **Cloudflare Tunnel** (`cloudflared`) handles HTTPS externally — no local TLS config needed
- PostgREST is NOT proxied through nginx; browser calls `https://selma-api.ozguryilmaz.com.tr` directly

## Local dev
- On `localhost` or `127.0.0.1`, `personal-info.html` auto-fills test data (TCKN: `12345678921`)
- Open `index.html` and click "Teste Başla" to walk through the full flow
- KVKK consent is persisted in `localStorage`, can be cleared via DevTools

## Admin panel
- Path: `/admin/login.html`
- Uses JWT auth (email/password via `AuthService` in `pg-config.js`)
- Users table with `role` column (`admin` / `psychologist`)
- After login redirects to `/admin/dashboard.html`, session via `localStorage` (`adminLogin` key)

## Scoring
- `assets/js/mmpi-scoring.js` — `MMPIScoring` class with scale definitions, K-correction, T-score conversion
- Scales: VRIN, TRIN, F, F1, F2, L, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si
- T-score formula: T = 50 + 10 * (raw - mean) / SD
- Interpretation thresholds: <30 very low, <40 low, <60 normal, <70 high, <80 very high, >=80 critical
- See `assets/js/mmpi-scoring.js:5` for item-to-scale mappings
- Test answers stored as `{ [question_number]: 'Doğru' | 'Yanlış' | 'Bilmiyorum' }`

## Test config
- `assets/js/test-config.js` — `testConfig` object with `maxDontKnowAnswers: 10`, `autoSaveInterval: 30000`, `enableLocalStorage: true`, `enableSupabaseSync: true`
- 567 total questions (MMPI-2), max 15 "Bilmiyorum" answers

## Git & contribution notes
- Real Supabase anon keys are in the repo — OK for public anon keys, but be mindful
- No CI/CD, no test framework, no linter/formatter config found
- Commit messages are in English (short descriptive style)

## Architecture notes
- All state flows: `localStorage` → optional Supabase sync (not the other way)
- Navigation: not a SPA — each page is a separate `.html` file, state passed via `localStorage`
- Duplicate test detection: checks both `localStorage` (`mmpiCompletedTests`) and PostgREST (`participants` + `test_results`)
- Debug helpers available in console: `window.mmpiDebug` (in test mode)
- Report page (`report.html`) uses Chart.js for profile graph and jsPDF/html2canvas for PDF export
