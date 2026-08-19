# Database Schema Documentation

This document is the single source of truth for the application database schema. It is generated from the numbered SQL migration scripts (`0*.sql`) located directly in the `database/` directory. If you need database information, read this file instead of the raw SQL scripts.

## Applying the Schema

The database is built in numeric order by `database/setup_runner.js`. The authoritative run order is:

| File | Purpose |
|------|---------|
| `00_create_anon.sql` | Enables `pgcrypto` extension |
| `00_postgrest_setup.sql` | Creates roles, `api` schema, auth/RPC functions, grants (duplicate of `02_postgrest_setup.sql`) |
| `01_schema.sql` | Creates all tables, indexes, triggers, constraints, seed admin users |
| `02_postgrest_setup.sql` | Identical copy of `00_postgrest_setup.sql` (kept for compatibility) |
| `03_taskdefinitions.sql` | Seeds 44 `task_definitions` rows |
| `04_data.sql` | Seeds categories, questions, scoring keys, t-score params, interpretations, KVKK, page content, settings |
| `05_setup_admin.sql` | Activates seed admin/psychologist users |
| `06_page_permissions.sql` | Creates `page_permissions` table, trigger, and 13 default rows |
| `07_add_session_code.sql` | Adds `session_code` and `current_index` to `test_results` |
| `08_page_permissions_incomplete_tests.sql` | Adds `incomplete-tests` page permission |
| `09_fix_update_updated_column.sql` | Redefines the `update_updated_column()` trigger function |

Note: `00_postgrest_setup.sql` and `02_postgrest_setup.sql` are identical; running both is harmless.

## Roles & Schemas

### Database Roles
- `anon` — Unauthenticated access. Used by the participant-facing front-end (personal-info, test pages). Can read/insert/update `participants` and `test_results`, read `questions`, `reports`, `kvkk`, `test_results_min`, and execute `api.login()`.
- `authenticated` — Logged-in users (psychologists/admins). Full CRUD on all `public` tables and executes `api` functions.

### Schemas
- `public` — All application tables.
- `api` — Auth/RPC functions for PostgREST.

## Tables

### 1. `users`
Application users (psychologists and admins).
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `email` (varchar(255)) - Required, Unique
- `password_hash` (varchar(255)) - Required (bcrypt)
- `role` (varchar(20)) - Required, default `'psychologist'`, CHECK (`admin`, `psychologist`)
- `name` (varchar(200))
- `is_active` (boolean) - default `true`
- `last_login` (timestamptz)
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Indexes: `idx_users_email`, `idx_users_role`.

### 2. `participants`
Individuals taking the test.
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `first_name` (varchar(100)) - Required
- `last_name` (varchar(100)) - Required
- `tc_no` (varchar(11)) - Unique
- `gender` (varchar(10)) - CHECK (`erkek`, `kadin`, `other`)
- `age` (integer) - CHECK (`0 <= age <= 150`)
- `institution_code` (varchar(50))
- `institution_name` (varchar(200))
- `profession` (varchar(100))
- `education` (varchar(50))
- `marital_status` (varchar(50))
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Indexes: `idx_participants_tc_no`, `idx_participants_created`.

### 3. `test_results`
Stores the results of tests taken by participants.
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `participant_id` (uuid) - FK → `participants(id)` ON DELETE SET NULL
- `test_answers` (jsonb) - Required, default `'{}'`
- `start_time` (timestamptz)
- `end_time` (timestamptz)
- `dont_know_count` (integer) - default `0`
- `completed_questions` (integer) - default `0`
- `total_questions` (integer) - default `567`
- `test_type` (varchar(50)) - default `'MMPI'`
- `test_version` (varchar(20)) - default `'1.0'`
- `status` (varchar(20)) - default `'completed'`, CHECK (`started`, `in_progress`, `completed`, `abandoned`)
- `session_code` (varchar(11)) - added by `07_add_session_code.sql`; used for participant resume lookup
- `current_index` (integer) - default `0`; added by `07_add_session_code.sql`
- `created` (timestamptz) - default `now()`
- `updated` (timestamptz) - default `now()`

Owner: `anon`. Indexes: `idx_test_results_created`, `idx_test_results_session_code`.

### 4. `question_category`
Categories for MMPI questions.
- `id` (serial) - PK
- `name` (varchar(100)) - Required, Unique
- `sort_order` (integer) - default `0`
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Seed data: `Genel`, `Aile`, `Sağlık`, `Cinsellik`, `Duygusal`, `Sosyal`.

### 5. `questions`
The MMPI questions.
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `question_number` (integer) - Required, Unique
- `question_text` (text) - Required
- `category_id` (integer) - FK → `question_category(id)` ON DELETE SET NULL
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Indexes: `idx_questions_number`, `idx_questions_category`. Seed data: 566 questions.

### 6. `reports`
Generated evaluation reports for test results.
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `test_result_id` (uuid) - FK → `test_results(id)` ON DELETE CASCADE
- `participant_id` (uuid) - FK → `participants(id)` ON DELETE SET NULL
- `report_content` (jsonb) - Required, default `'{}'`
- `report_type` (varchar(50)) - default `'standard'`
- `generated_by` (varchar(100))
- `created` (timestamptz) - default `now()`
- `updated` (timestamptz) - default `now()`
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Indexes: `idx_reports_test_result`, `idx_reports_participant`, `idx_reports_created`.

### 7. `scoring_keys`
Maps questions to scales with the answer that scores a point.
- `id` (serial) - PK
- `scale_name` (varchar(10)) - Required (L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si)
- `question_number` (integer) - Required
- `scoring_answer` (varchar(20)) - Required, CHECK (`Doğru`, `Yanlış`)
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`
- UNIQUE (`scale_name`, `question_number`)

Indexes: `idx_scoring_keys_scale`, `idx_scoring_keys_question`. Seed data covers all 13 scales.

### 8. `t_score_norms`
Normative mappings from raw scores to T-scores.
- `id` (bigserial) - PK
- `test_version` (text) - Required, default `'MMPI'`
- `locale` (text) - Required, default `'TR'`
- `scale_name` (text) - Required
- `gender` (text) - Required, CHECK (`male`, `female`)
- `raw_score` (integer) - Required, CHECK (`>= 0`)
- `t_score` (integer) - Required, CHECK (`20 <= t_score <= 120`)
- `age_group` (text) - default `'adult'`
- `notes` (text)
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`
- UNIQUE (`test_version`, `locale`, `scale_name`, `gender`, `raw_score`)

Indexes: `idx_tnorm_lookup(scale_name, gender, raw_score)`. Note: this table has no seed data in the migration scripts.

### 9. `t_score_params`
Parameters (mean, standard deviation, K correction) for T-score calculation.
- `id` (bigserial) - PK
- `test_version` (text) - Required, default `'MMPI'`
- `locale` (text) - Required, default `'TR'`
- `age_group` (text) - Required, default `'adult'`
- `scale_name` (text) - Required
- `gender` (text) - Required, CHECK (`male`, `female`)
- `mean_m` (numeric(6,2)) - Required
- `sd` (numeric(6,2)) - Required
- `k_correction` (numeric(4,2)) - default `0`
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`
- UNIQUE (`test_version`, `locale`, `age_group`, `scale_name`, `gender`)

Seed data: 26 rows (13 scales × 2 genders).

### 10. `mmpi_interpretations`
Interpretation texts based on MMPI scale T-score ranges.
- `id` (serial) - PK
- `scale_name` (varchar(10)) - Required (L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si)
- `min_t_score` (integer) - Required
- `max_t_score` (integer) - Required
- `description` (text) - Required
- `category` (varchar(20)) - Required, CHECK (`validity`, `clinical`)
- `gender` (varchar(10)) - used for gender-specific scales (e.g. `Mf`)
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Indexes: `idx_mmpi_int_scale`, `idx_mmpi_int_range(scale_name, min_t_score, max_t_score)`. Seed data: 56 rows (50 non-gender-specific + 6 `Mf` rows split by male/female).

### 11. `page_content`
Dynamic content for public pages.
- `id` (integer) - PK
- `page_key` (varchar(50)) - Required, Unique
- `page_title` (varchar(255)) - Required, default `''`
- `page_subtitle` (text) - default `''`
- `page_body` (text) - default `''`
- `updated_at` (timestamptz) - default `now()`

Owner: `anon`. Seed data: `gizlilik`, `kullanim`, `hakkimizda`.

### 12. `kvkk`
KVKK (Personal Data Protection) consent text.
- `id` (serial) - PK
- `kvkk_title` (text)
- `kvkk_text` (text) - Required
- `kvkk_required` (boolean) - default `true`
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Seed data: 1 KVKK consent row.

### 13. `task_definitions`
Predefined security/competency tasks used in psychologist evaluations.
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `task_number` (integer) - Required (1–44)
- `task_description` (text)
- `is_active` (boolean) - default `true`
- `category` (varchar(100)) - e.g. `'security'`
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Indexes: `idx_task_definitions_id`. Seed data: 44 rows (category `security`).

### 14. `settings`
General application settings (key-value).
- `id` (serial) - PK
- `setting_key` (varchar(100)) - Required, Unique
- `setting_value` (text)
- `created_at` (timestamptz) - default `now()`
- `updated_at` (timestamptz) - default `now()`

Seed data: `test_version=MMPI`, `max_dont_know=10`, `auto_save_interval=30000`, `app_name=MMPI Psikolojik Degerlendirme Sistemi`.

### 15. `sessions`
Authentication sessions (replaces PG_API Auth sessions).
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `user_id` (uuid) - Required, FK → `users(id)` ON DELETE CASCADE
- `token` (varchar(512)) - Required, Unique
- `expires_at` (timestamptz) - Required
- `created_at` (timestamptz) - default `now()`

Indexes: `idx_sessions_token`, `idx_sessions_user`. Note: the migration scripts no longer seed sessions; authentication is JWT-based.

### 16. `page_permissions`
Role-based permission control per page. Created by `06_page_permissions.sql`.
- `id` (uuid) - PK, defaults to `gen_random_uuid()`
- `page_name` (varchar(100)) - Required, Unique
- `page_title` (varchar(200)) - Required
- `admin` (boolean) - Required, default `true`
- `psychologist` (boolean) - Required, default `true`
- `created` (timestamptz) - default `now()`
- `updated` (timestamptz) - default `now()`

Owner: `anon`. Seed data (14 rows across `06` and `08`):

| page_name | admin | psychologist |
|-----------|:-----:|:------------:|
| dashboard | ✓ | ✓ |
| test-results | ✓ | ✓ |
| reports | ✓ | ✓ |
| questions | ✓ | ✓ |
| task-definitions | ✓ | ✓ |
| analytics | ✓ | ✓ |
| settings | ✓ | ✓ |
| settings-kvkk | ✓ | ✓ |
| settings-letters | ✓ | ✓ |
| settings-pages | ✓ | ✓ |
| settings-admins | ✓ | ✗ |
| settings-categories | ✓ | ✗ |
| settings-debug | ✓ | ✗ |
| incomplete-tests | ✓ | ✓ |

## Views

### `test_results_min`
Lightweight view over `test_results` for duplicate-test detection.
- Columns: `id`, `participant_id`, `status`, `created`

## Functions

### `public.update_updated_column()` (trigger function)
Auto-updates timestamp columns on row modification. Sets `updated` and/or `updated_at` (whichever column exists) to `NOW()`. Final version defined in `09_fix_update_updated_column.sql`.

### `public.update_page_permissions_updated()` (trigger function)
Sets `updated = now()` on `page_permissions`.

### API Schema (`api`)
Functions for PostgREST auth (defined in `00_postgrest_setup.sql` / `02_postgrest_setup.sql`):
- `api.url_b64(data bytea)` → `text` — URL-safe base64 encoding.
- `api.sign_jwt(payload jsonb, secret text)` → `text` — HMAC-SHA256 JWT signing (pgcrypto, no pgjwt).
- `api.login(email text, password text)` → `text` — Email/password login; verifies bcrypt hash; returns JWT. SECURITY DEFINER. Exposed to `anon`.
- `api.me()` → `jsonb` — Current user info from JWT claims.
- `api.set_jwt_secret()` → `void` — Sets the JWT signing secret via the custom GUC `app.jwt_secret` (called by PostgREST `db-pre-request`).

### Public schema functions (admin RPCs)
- `public.create_user(name text, email text, password text, role text DEFAULT 'psychologist')` → `jsonb` — Hashes password and inserts into `users`. SECURITY DEFINER. Executable by `authenticated`.
- `public.update_user(user_id uuid, name text DEFAULT NULL, email text DEFAULT NULL, role text DEFAULT NULL, password text DEFAULT NULL, is_active boolean DEFAULT NULL)` → `jsonb` — Updates only the provided fields. SECURITY DEFINER. Executable by `authenticated`.

## Triggers

`update_updated_column()` (applied in `01_schema.sql`) on:
`users`, `participants`, `test_results`, `questions`, `reports`, `scoring_keys`, `t_score_norms`, `t_score_params`, `mmpi_interpretations`, `kvkk`, `task_definitions`, `question_category`, `settings`.

Dedicated trigger on `page_permissions` (applied in `06_page_permissions.sql`):
- `trg_page_permissions_updated` → `public.update_page_permissions_updated()`

## PostgREST / Grants Summary

- `api` schema: USAGE granted to `anon` and `authenticated`; EXECUTE on `api.login` for `anon`; EXECUTE on all `api` functions for `authenticated`.
- `public` schema: USAGE for `anon` and `authenticated`.
- `anon` table grants: SELECT, INSERT, UPDATE on `participants` and `test_results`; SELECT on `questions`, `reports`, `kvkk`, `test_results_min`; USAGE on all sequences. Default privileges: SELECT, INSERT, UPDATE on new tables.
- `authenticated`: ALL privileges on all `public` tables and sequences. Default privileges grant ALL to `authenticated` for new tables/sequences.
- `page_content`, `page_permissions`, `test_results` are owned by `anon`; all three (plus `reports`) get ALL grants to both `anon` and `authenticated`.

### JWT Payload
```json
{
  "role": "authenticated",
  "user_id": "UUID",
  "email": "...",
  "name": "...",
  "role_name": "admin|psychologist",
  "exp": <unix_timestamp + 24h>
}
```

## Seed Users

Inserted in `01_schema.sql` and activated in `05_setup_admin.sql`:
- `admin@psikolog.com` (role `admin`, name `Dr. Admin`)
- `psikolog1@psikolog.com` (role `psychologist`, name `Dr. Ayse Yilmaz`)

Password hashes are generated/overridden by the DB setup process; change them on first login.

## Additional Runtime Table

`system_init` is created by `database/setup_runner.js` (not by the SQL scripts). It tracks whether initial setup completed:
- `id` (serial) - PK
- `initialized_at` (timestamptz) - default `now()`
- `status` (varchar(50)) - default `'completed'`

## Relationship Diagram (Summary)
```
users ────────→ sessions            (1:N, via user_id)
participants ─→ test_results        (1:N, via participant_id)
participants ─→ reports             (1:N, via participant_id)
test_results ─→ reports             (1:N, via test_result_id)
question_category ─→ questions      (1:N, via category_id)
questions ─────→ scoring_keys       (1:N, via question_number)
scoring_keys ──→ t_score_norms      (N:1, via scale_name)
scoring_keys ──→ t_score_params     (N:1, via scale_name)
t_score_params ─→ mmpi_interpretations (N:1, via scale_name)
```