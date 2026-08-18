# AGENTS.md

This file contains essential guidance for agents working in this repository. The project's primary documentation is Turkish and lives in `dokumanlar/`; `belgeler/` holds raw SQL/data dumps. You must be able to read Turkish (UI, DB data, and docs are Turkish).

**Read `dokumanlar/ozKurallar.md` first** — it is the project's LLM rulebook (language rules, architecture, DB quirks). `tasks/` contains numbered functional specs for agent work — read the relevant one before touching those areas.

## Rules
- No Turkish code comments or commit messages; commit messages are short English.
- Vanilla HTML/CSS/JS. No bundler, no framework, no build step, no root `package.json`. Only `tests/e2e/` is npm-managed.

## Architecture
- Backend is **PostgreSQL + PostgREST only** — there is no custom API server. All DB access goes through `window.PG_API` / `window.AuthService` in `frontend/assets/js/pg-config.js` (`PostGrestClient`-style chainable queries, e.g. `PG_API.from('table').eq('x',1)`).
- Frontend is static files served from `frontend/` by nginx; nginx proxies `/api/` → postgrest:3000 (same origin). `pg-config.js` auto-switches: localhost → `http://postgrest:3000`, otherwise prod `https://selma.ozguryilmaz.com.tr/api`.
- Page flow: `index.html → testebasla.html → personal-info.html → kvkk-consent.html → mmpi-test.html → test-complete.html → report.html`. State is passed via `localStorage` keys (`mmpiTestProgress`, `mmpiSessionCode`, `mmpiTestResults`; auth tokens `mmpi_token`, admin session `adminLogin`) — no query params/server session.
- Script loading is **per-page, not a global chain**. Only `mmpi-test.html` loads the full chain in strict order: Bootstrap/jQuery → `test-config.js` → `mmpi-scoring.js` → `pg-config.js` → `mmpi-test.js`. Do not reorder; globals are set on `window`.

## Commands
- Copy `env.example` → `.env` (`JWT_SECRET` must be ≥32 chars; `DB_*`, `APP_PORT`). Bring up the whole stack: `docker compose up -d --build` (db=postgres:15, api=postgrest:v12, pgadmin, nginx, setup_runner, e2e).
- DB schema is applied by the `setup_runner` service (UI: `/admin/setup.html`, or HTTP `/execute` on port 3098): it runs `database/00_create_anon.sql` then each `database/NN_*.sql` in numeric order, stopping on failure, and records a `system_init` row. Re-running is idempotent via `CREATE TABLE IF NOT EXISTS`. `/reset` drops the `public` schema (destructive).
- Static dev server: `python3 -m http.server 8000` from `frontend/`. `personal-info.js` autofills test data (TCKN `12345678921`) on localhost/127.0.0.1.
- Admin test login: `admin@psikolog.com` / `admin123`.

## DB gotchas (top bug sources)
- Timestamp column names differ per table: `participants`, `test_results`, `reports` use `created`/`updated` (no `_at` — see `database/scripts/*.sql`, `database_tables.md`); other tables (`questions`, `task_definitions`, `settings`, etc.) use `created_at`/`updated_at`. **Reference `01_schema.sql` uses `_at` everywhere — do not trust it.** JS sorts those three tables with `.order('created')`.
- Never send timestamps in INSERT/UPDATE on `participants`, `test_results`, `reports` — let `DEFAULT now()` fire (explicit payloads have caused PGRST204).
- Gender stored in DB as `'erkek'`/`'kadin'`; HTML forms submit `'male'`/`'female'` — map `{ male: 'erkek', female: 'kadin', other: 'other' }`.
- `anon` (pre-login) PostgREST role needs explicit SELECT grants on every table test-takers read (`participants`, `test_results`, `questions`, `kvkk`, `reports`, `test_results_min`) — see `00_postgrest_setup.sql`.
- Auth is `POST /rpc/login {email, password}` → JWT signed by the `api.login()` DB function (pgcrypto HMAC); `JWT_SECRET` is passed to PostgREST as `app.jwt_secret` via the DB URI `options` param in `docker-compose.yaml`.

## E2E tests (`tests/e2e/`)
- **DANGER: `playwright.config.js` defaults `baseURL` to the live production site** `https://selma.ozguryilmaz.com.tr`. Running without `BASE_URL` set creates real test records in prod; `page-content.spec.js` deliberately modifies live page content. Always set `BASE_URL` (e.g. `http://localhost:8000` for local) unless you intend to test prod.
- Run: `cd tests/e2e && BASE_URL=http://localhost:8000 node node_modules/@playwright/test/cli.js test --project=chromium`. If host `npm` is missing, use the wrapper `tests/e2e/bin/npm` (exports `NODE_PATH=/tmp/npm/usr/share/nodejs`). In Docker: `docker compose run --rm e2e`.
- Test-runner web UI (admin page `frontend/admin/test-runner.html`): `node tests/e2e/server.js` listens on 3099, spawns Playwright, then copies the HTML report to `frontend/test-reports/index.html`. It inherits the same BASE_URL hazard.
- Suite is Chromium-only, single worker, serial flow; full-flow spec answers all 566 questions.

## MMPI specifics
- 566 questions; answers are `{ [question_number]: 'Doğru' | 'Yanlış' | 'Bilmiyorum' }`. `test-config.js` caps `maxDontKnowAnswers` at **10** (trust the code over the 15 stated in `ozKurallar.md`). Auto-save every 30s to localStorage (+DB once a session code exists).
- Custom interaction in `mmpi-test.html`: left-click = Doğru, right-click = Yanlış, mobile swipe, keyboard 1/D and 2/Y.