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
4. `supabase-config.js` — initialized last (reads `window.SUPABASE_CONFIG`)
5. Page-specific JS (e.g. `mmpi-test.js`, `personal-info.js`)

**DO NOT change this order** — scripts depend on globals set by earlier ones.

## Supabase
- Loaded via CDN: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- The real keys are **committed** in `assets/js/supabase-config.js` — treat them as public anon keys, but do not commit service_role keys
- Falls back to **offline/localStorage-only mode** if Supabase is unreachable or misconfigured — all core features work without a backend
- Expected tables: `participants`, `test_results`, `questions`, `reports`, `scoring_keys`, `t_score_norms`, `kvkk` (see SQL in `dokumanlar/`)

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
- **nginx** on port 80 serves the app directly from this directory
- **Cloudflare Tunnel** (`cloudflared`) handles HTTPS externally — no local TLS config needed
- Port 443 is open but traffic arrives via tunnel, not direct TLS termination

## Local dev
- On `localhost` or `127.0.0.1`, `personal-info.html` auto-fills test data (TCKN: `12345678921`)
- Open `index.html` and click "Teste Başla" to walk through the full flow
- KVKK consent is persisted in `localStorage`, can be cleared via DevTools

## Admin panel
- Path: `/admin/login.html`
- Uses Supabase Auth (email/password via `AuthService` in `supabase-config.js`)
- Users table with `role` column (`admin` / `psychologist`)
- After login redirects to `/admin/dashboard.html`, session via `localStorage` (`adminSession` key)

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
- Duplicate test detection: checks both `localStorage` (`mmpiCompletedTests`) and Supabase (`participants` + `test_results`)
- Debug helpers available in console: `window.mmpiDebug` (in test mode)
- Report page (`report.html`) uses Chart.js for profile graph and jsPDF/html2canvas for PDF export
