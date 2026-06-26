# AGENTS.md — MMPI Psikolojik Test Sistemi

## Project overview
Vanilla HTML/CSS/JS single-page app (no bundler, no framework, no build step). MMPI-2 psychological test with optional PostgreSQL backend. Turkish language throughout. Served via any static file server.

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
4. **`pg-config.js`** — PostgreSQL API client
5. Page-specific JS (e.g. `mmpi-test.js`, `personal-info.js`)

**DO NOT change this order** — scripts depend on globals set by earlier ones.

## Environment & Server Details

| Service | Hostname | Port | Public URL |
|---|---|---|---|
| **PostgreSQL** | `postgres_db` | 5432 | — |
| **PostgREST** (internal) | `postgrest` | 3000 | proxied via nginx |
| **Web App** (static files) | nginx + Cloudflare Tunnel | 80/443 | `https://selma.ozguryilmaz.com.tr` |

- **Nginx reverse proxy**: `/api/` → `http://postgrest:3000/` (same origin, no CORS needed)
- Browser calls PostgREST at `https://selma.ozguryilmaz.com.tr/api/...` (same domain)
- `pg-config.js` switches URL based on hostname:
  - dev → `http://postgrest:3000` (direct Docker internal)
  - prod → `https://selma.ozguryilmaz.com.tr/api` (via nginx proxy)

## Backend (PostgreSQL + PostgREST)
- The project uses direct PostgreSQL via **PostgREST** (a standalone REST API server that turns PostgreSQL into a REST API — no custom backend code)
- `pg-config.js` provides `window.PG_API` (generic CRUD via `fetch` to PostgREST) and `window.AuthService` (JWT auth via `/rpc/login` database function)
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
- Public URL: `https://selma.ozguryilmaz.com.tr/api`
- Login flow: `POST /api/rpc/login {email, password}` → JWT string (verified by `api.login()` DB function)
- All data CRUD: `GET/POST/PATCH/DELETE /api/table_name?col=eq.value`
- Auth: JWT `role` claim tells PostgREST which DB role to use (anon vs authenticated)
- Start: `postgrest postgrest.conf` (inside Docker, nginx proxy at `/api/` → `postgrest:3000`)

### Key changes in HTML
- **Note**: `assets/js/debug.js` and `admin/js/settings.js` were updated to remove legacy auth calls

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
- PostgREST is proxied through nginx at `/api/` → `http://postgrest:3000` (same origin, no CORS problems)

## Local dev
- On `localhost` or `127.0.0.1`, `personal-info.html` auto-fills test data (TCKN: `12345678921`)
- Open `index.html` and click "Teste Başla" to walk through the full flow
- KVKK consent is persisted in `localStorage`, can be cleared via DevTools

## Admin panel
- Path: `/admin/login.html`
- Uses JWT auth (email/password via `AuthService` in `pg-config.js`)
- **User Roles (`admin` vs `psychologist`)**:
  - `admin`: Tam yetkiye sahip kullanıcıdır. Ayarlara ve sisteme tam erişimi vardır. Sadece adminler "Psikolog Tanımları" sayfasını görebilir ve yeni psikolog hesapları oluşturabilir.
  - `psychologist`: Standart erişime sahip kullanıcıdır. Ayarlardaki "Psikolog Tanımları" sayfasına erişimleri kısıtlanmıştır, diğer test ve raporlama özelliklerini kullanabilirler.
- After login redirects to `/admin/dashboard.html`, session via `localStorage` (`adminLogin` key)

## Scoring
- `assets/js/mmpi-scoring.js` — `MMPIScoring` class with scale definitions, K-correction, T-score conversion
- Scales: VRIN, TRIN, F, F1, F2, L, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si
- T-score formula: T = 50 + 10 * (raw - mean) / SD
- Interpretation thresholds: <30 very low, <40 low, <60 normal, <70 high, <80 very high, >=80 critical
- See `assets/js/mmpi-scoring.js:5` for item-to-scale mappings
- Test answers stored as `{ [question_number]: 'Doğru' | 'Yanlış' | 'Bilmiyorum' }`

## Test config
- `assets/js/test-config.js` — `testConfig` object with `maxDontKnowAnswers: 10`, `autoSaveInterval: 30000`, `enableLocalStorage: true`, `enableDbSync: true`
- 567 total questions (MMPI-2), max 15 "Bilmiyorum" answers

## Git & contribution notes
- No CI/CD, no test framework, no linter/formatter config found
- Commit messages are in English (short descriptive style)

## Security & Production Readiness

### ⚠️ `postgrest.conf` — Production'e geçmeden önce yapılması gerekenler

`postgrest.conf` hâlen **development placeholder** değerleri içerir:
- `db-uri` → şifre `postgres` (düz metin)
- `jwt-secret` → `super-secret-jwt-key-change-this-in-production`
- `db-pre-request` → aynı placeholder secret
- `cors-origin = "*"` (çok permissif)

**Bu dosya git'te tutulduğu için şifreleri doğrudan yazmak güvenli değil.** Bunun yerine PostgREST'in **ortam değişkeni substitution** özelliği kullanılmalı:

```ini
# postgrest.conf (git'e commit edilecek hali)
db-uri = "postgres://postgres:$(DB_PASSWORD)@postgres_db:5432/mmpi_db"
jwt-secret = "$(JWT_SECRET)"
db-pre-request = "SET app.jwt_secret = '$(JWT_SECRET)'"
cors-origin = "https://selma.ozguryilmaz.com.tr"   # artık gerekli değil (same-origin), ama opsiyonel
```

Ortam değişkenleri ise **`.env` dosyasında** tutulur ve bu dosya `.gitignore`'a eklenir:

```bash
# .env (git IGNORE edilecek)
DB_PASSWORD=Mmpi_Db_2024!
JWT_SECRET=fH3kL9sA...
```

PostgREST çalıştırılırken `.env` dosyası ortama yüklenir:
```bash
export $(grep -v '^#' .env | xargs) && postgrest postgrest.conf
# veya Docker ile:
docker run -e DB_PASSWORD=... -e JWT_SECRET=... postgrest ...
```

### Secret üretme komutları
```bash
# PostgreSQL şifresi
openssl rand -base64 12

# JWT secret (64 bayt, base64)
openssl rand -base64 48
```

### Production checklist
- [ ] `cors-origin` daralt (`"*"` → `"https://selma.ozguryilmaz.com.tr"`)
- [ ] `db-uri` environment variable'a çevir
- [ ] `jwt-secret` environment variable'a çevir
- [ ] `.env` oluştur ve `.gitignore`'a ekle
- [ ] PostgREST container'ı `.env` ile başlat
- [ ] `tests/index.html` üzerinden tüm kontrolleri doğrula

## Architecture notes
- All state flows: `localStorage` → optional PostgreSQL sync (not the other way)
- Navigation: not a SPA — each page is a separate `.html` file, state passed via `localStorage`
- Duplicate test detection: checks both `localStorage` (`mmpiCompletedTests`) and PostgREST (`participants` + `test_results`)
- Debug helpers available in console: `window.mmpiDebug` (in test mode)
- Report page (`report.html`) uses Chart.js for profile graph and jsPDF/html2canvas for PDF export

## Known bug fixes & migration notes

### 2024-06: `PG_API.from().insert().select()` chain broken
**Symptoms**: `TypeError: PG_API.from(...).insert(...).select is not a function` on `personal-info.js:119`.

**Root cause**: `pg-config.js`'s `insert()` method was `async` and returned a Promise, so `.select()` (and `.single()`) could not be chained after it.

**Fix** (`assets/js/pg-config.js:274-279`):
- Changed `insert()` from `async` to synchronous — stores insert data in `_insertData` and returns `this` (builder) for chaining.
- Added `_operation` and `_insertData`/`_upsertData` state variables to the builder.
- Modified `then()` to detect `_operation === 'insert'` and execute a `POST /table?select=cols` with `Prefer: return=representation` header instead of the default GET.
- Applied same pattern to `upsert()` for consistency.
- The `_buildQuery()` no longer includes `_select` params; instead `select` is handled separately in the URL for both GET and POST paths.

**Files using `.insert().select()` (all fixed by the `pg-config.js` change)**:
- `personal-info.js:108-123` — `.insert([...]).select()`
- `mmpi-test.js:669-673` — `.insert([...]).select().single()`
- `test-results.js:1247-1256` — `.insert({...}).select().single()`

### 2024-06: Column name mismatch (`created` vs `created_at`)
**Symptoms**: PostgREST returning `400 Bad Request` on INSERT to `participants` and `test_results` tables.

**Root cause**: JS code sent `created` as column name, but the schema (`database/01_schema.sql`) defines the column as `created_at`.

**Fix**: Changed all DB insert references from `created` to `created_at`:
- `personal-info.js:34,121` — formData key and insert payload
- `mmpi-test.js:713` — `test_results` insert payload

### 2024-06: Gender value mismatch (`male/female` vs `erkek/kadin`)
**Symptoms**: PostgREST `400 Bad Request` on INSERT/UPDATE to `participants` table — `gender` column has CHECK constraint: `gender IN ('erkek', 'kadin', 'other')`.

**Root cause**: HTML form (`personal-info.html:47-48`) uses `male`/`female` as option values, but the DB schema (`database/01_schema.sql:39`) constrains to Turkish values `erkek`/`kadin`/`other`.

**Fix**: Added gender mapping before DB inserts in both files:
- `personal-info.js:103-105` — `const genderMap = { 'male': 'erkek', 'female': 'kadin', 'other': 'other' };`
- `mmpi-test.js:651-653` — same mapping applied
