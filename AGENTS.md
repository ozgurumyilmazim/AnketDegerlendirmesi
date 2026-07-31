# AGENTS.md — MMPI Psikolojik Test Sistemi

## Project
Vanilla HTML/CSS/JS MMPI-2 test app (no bundler, no framework, no build step). Turkish UI throughout. Served via any static file server. PostgreSQL optional via PostgREST.

## Key directories
- `frontend/` — Root for all HTML pages, `assets/js/`, `assets/css/`, `admin/`
- `database/` — SQL schemas, migrations, PostgREST setup
- `nginx/` — Reverse proxy config (proxies `/api/` → `postgrest:3000`)

## Page flow
```
index.html → personal-info.html → kvkk-consent.html → mmpi-test.html → test-complete.html → report.html
```
State passed via `localStorage` (no query params, no server session).

## Script loading (per-page, NOT global 5-step order)
Only `mmpi-test.html` loads the full chain: Bootstrap/jQuery → `test-config.js` → `mmpi-scoring.js` → `pg-config.js` → `mmpi-test.js`.
Other pages load only what they need. `pg-config.js` sets `window.PG_API` and `window.AuthService` — needed by every page that talks to DB.

## Environment

| Service | Host | Port |
|---|---|---|
| PostgreSQL | `postgres_db` | 5432 |
| PostgREST | `postgrest` | 3000 |
| Web (nginx) | `selma.ozguryilmaz.com.tr` | 80/443 |

- `pg-config.js` auto-switches URL: dev → `http://postgrest:3000`, prod → `https://selma.ozguryilmaz.com.tr/api`
- Nginx proxies `/api/` → `postgrest:3000` (same origin, no CORS needed)

## Backend (PostgreSQL + PostgREST — no custom API server)
- PostgREST is a standalone binary that exposes PG tables as REST endpoints
- All DB access: `PG_API.from('table').select('cols').eq('field', val)`
- Auth: `POST /api/rpc/login {email, password}` → JWT string (signed by `api.login()` DB function via pgcrypto HMAC)
- PostgREST role dispatch: `anon` (no JWT) vs `authenticated` (with JWT, role claim in token)
- **`anon` needs explicit SELECT grants** on every table the test-taker reads (participants, test_results, questions, kvkk, reports, test_results_min)

## Running locally
```sh
# Any static file server:
python3 -m http.server 8000   # from frontend/
```
`personal-info.html` auto-fills test data on localhost (TCKN: `12345678921`).

## Admin panel
`/admin/login.html` — JWT auth via `AuthService`, session in `localStorage` (`adminLogin` key).
- `admin`: full access, can manage psychologists
- `psychologist`: restricted, cannot access "Psikolog Tanımları"

## Page permissions system
- Table `page_permissions` stores per-page access for `admin` and `psychologist` roles.
- Every admin page loads `page-permissions.js` (after `pg-config.js`) and calls `checkPagePermission('page-name')` in its auth flow.
- `showPagePermissionError()` handles error display and redirect to `dashboard.html`.
- Management page: `/admin/settings-permissions.html` — **NOT in `page_permissions` table**, protected by hard-coded `AuthService.isAdmin()` check.
- Default data in `database/scripts/page_permissions.sql`.
- DB columns: `created`/`updated` (no `_at` suffix, matching live DB convention per ⚠️ note above).

## Scoring
- `assets/js/mmpi-scoring.js` — `MMPIScoring` class, scales: VRIN, TRIN, F, F1, F2, L, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si
- T = 50 + 10 × (raw − mean) / SD
- Thresholds: <30 very low, <40 low, <60 normal, <70 high, <80 very high, ≥80 critical
- Answers: `{ [question_number]: 'Doğru' | 'Yanlış' | 'Bilmiyorum' }`

## Test config (`test-config.js`)
- `maxDontKnowAnswers: 10`, `autoSaveInterval: 30000`, `enableLocalStorage: true`, `enableDbSync: true`
- 566 questions, max 15 "Bilmiyorum"

## Save & Resume feature
- User clicks "Kaydet ve Çık" → 11-char random code (A-Z, 2-9, no 0/1/O/I) generated → progress saved to DB with `status='in_progress'` → code shown in modal
- Resume: `test-devam.html` → enter TC No + session code → lookup by `participants.tc_no` + `test_results.session_code` where `status IN ('started','in_progress')` → restore to localStorage → redirect to `mmpi-test.html?resume=1`
- `mmpi-test.js` `loadSavedSession()` reads `mmpiTestProgress` + `mmpiSessionCode` from localStorage and restores `currentQuestionIndex`, `answers`, `dontKnowCount`
- Auto-save every 30s: saves to localStorage always; saves to DB via `saveToDb()` only when `sessionCode` is set
- DB columns: `test_results.session_code VARCHAR(11)`, `test_results.current_index INTEGER DEFAULT 0` (added in `add_save_code_column.sql`)
- On test completion (`finishTest()`): session code and progress are cleared from localStorage (`mmpiSessionCode`, `mmpiTestProgress`); `saveTestResults()` sets status='completed'
- `test-devam.html` looks up participant by TCKN, then test_results by participant_id + session_code, restores progress to `mmpiTestProgress` and `mmpiSessionCode`
- Page flow for resume: `index.html → test-devam.html → mmpi-test.html?resume=1` (bypasses personal-info and kvkk-consent pages)

## ⚠️ DB schema quirks (most common bugs)
1. **Column names**: `database/scripts/*.sql` (the actual DB) uses `created`/`updated` (no `_at` suffix) on `participants`, `test_results`, `reports`. The reference file `01_schema.sql` uses `created_at`/`updated_at`. **JS code must use `created`/`updated`** in SELECT/ORDER BY for these tables.
2. **Never send timestamps in INSERT** — let DB use `DEFAULT now()`. Both `created` and `created_at` payloads have caused PGRST204 errors.
3. **Gender values** in DB: `'erkek'`/`'kadin'`. HTML form sends `'male'`/`'female'`. Map via `{ male: 'erkek', female: 'kadin', other: 'other' }`.

## ⚠️ pg-config.js URL construction
In `pg-config.js:257-259`, when `_select='*'` (default) and filters exist, the `?` separator between table name and query params can be dropped in the URL builder. The fix is in place but if changing this code, ensure it produces `/table`, `/table?filter=val`, `/table?select=cols`, and `/table?select=cols&filter=val` correctly.

## `postgrest.conf` — replace placeholders before production
`db-uri`, `jwt-secret` in `postgrest.conf` are development placeholders. Use environment variables (`$(DB_PASSWORD)`, `$(JWT_SECRET)`) via `.env` (gitignored). See `env.example` and `docker-compose.yaml` for the working config.

## E2E Tests (Playwright)
- `tests/e2e/` — Playwright test suite (Chromium, headless)
- `npm test` → runs full flow: user registration → MMPI test → admin verification
- `npm run server` → starts test runner web UI at port 3099

### Test Runner Web UI
- Admin page: `https://selma.ozguryilmaz.com.tr/admin/test-runner.html`
- API: `https://selma.ozguryilmaz.com.tr/test-runner/` (proxied via nginx → host:3099)
- Start server: `cd tests/e2e && setsid node server.js > /tmp/test-runner.log 2>&1 &`
- Rapor: `https://selma.ozguryilmaz.com.tr/test-reports/`

### Host setup (npm not globally installed)
- npm extracted from deb package to `/tmp/npm/usr/share/nodejs/`
- Set `NODE_PATH=/tmp/npm/usr/share/nodejs` before running npm commands
- Playwright CLI: `node node_modules/@playwright/test/cli.js test`
- Systemd service (manual): `sudo mv /tmp/test-runner.service /etc/systemd/system/ && sudo systemctl enable --now test-runner`

## No CI/CD, no linter, no formatter
Commit messages are short English.
