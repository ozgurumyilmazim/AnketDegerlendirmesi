# Database Schema Documentation

This document provides an overview of the database tables based on the SQL scripts located in `database/scripts`.

## Tables Overview

### 1. `kvkk`
Stores KVKK (Personal Data Protection) text, titles, and whether consent is required.
- `id` (integer) - Primary Key
- `kvkk_title` (text)
- `kvkk_text` (text) - Required
- `kvkk_required` (boolean) - Default: true
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 2. `mmpi_interpretations`
Stores interpretation texts based on MMPI scale T-score ranges.
- `id` (integer) - Primary Key
- `scale_name` (varchar) - Required
- `min_t_score` (integer) - Required
- `max_t_score` (integer) - Required
- `description` (text) - Required
- `category` (varchar) - Required (Values: 'validity', 'clinical')
- `gender` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. `page_content`
Stores dynamic content for various pages in the application.
- `id` (integer) - Primary Key
- `page_key` (varchar) - Required, Unique
- `page_title` (varchar) - Required
- `page_subtitle` (text)
- `page_body` (text)
- `updated_at` (timestamp)

### 4. `participants`
Information about the individuals taking the test.
- `id` (uuid) - Primary Key
- `first_name` (varchar) - Required
- `last_name` (varchar) - Required
- `tc_no` (varchar) - Unique
- `gender` (varchar) - (Values: 'erkek', 'kadin', 'other')
- `age` (integer) - Range: 0 to 150
- `institution_code` (varchar)
- `institution_name` (varchar)
- `profession` (varchar)
- `education` (varchar)
- `marital_status` (varchar)
- `created` (timestamp)
- `updated` (timestamp)

### 5. `questions`
Stores the MMPI questions.
- `id` (integer) - Primary Key
- `question_number` (integer) - Required, Unique
- `question_text` (text) - Required
- `category` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 6. `reports`
Stores the generated evaluation reports for test results.
- `id` (uuid) - Primary Key
- `test_result_id` (uuid) - Foreign Key to `test_results`
- `report_content` (jsonb) - Required
- `report_type` (varchar) - Default: 'standard'
- `generated_by` (varchar)
- `psychologist_name` (text)
- `evaluation_date` (date)
- `participation` (text)
- `validity` (text)
- `additional_evaluation_note` (text)
- `pdp_results` (jsonb)
- `task_definitions_evaluation` (jsonb)
- `evaluation_process` (text)
- `measurement_process` (text)
- `competency_evaluation` (jsonb)
- `session_need_status` (text)
- `session_explanation` (text)
- `data_usage_recommendations` (text)
- `created` (timestamp)
- `updated` (timestamp)

### 7. `scoring_keys`
Maps questions to scales based on the correct scoring answer.
- `id` (integer) - Primary Key
- `scale_name` (varchar) - Required
- `question_number` (integer) - Required
- `scoring_answer` (varchar) - Required (Values: 'Doğru', 'Yanlis')
- Constraints: Unique combination of (`scale_name`, `question_number`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 8. `sessions`
Manages user authentication sessions.
- `id` (uuid) - Primary Key
- `user_id` (uuid) - Required, Foreign Key to `users`
- `token` (varchar) - Required, Unique
- `expires_at` (timestamp) - Required
- `created_at` (timestamp)

### 9. `settings`
Stores general application settings (key-value pairs).
- `id` (integer) - Primary Key
- `setting_key` (varchar) - Required, Unique
- `setting_value` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 10. `t_score_norms`
Normative mappings from raw scores to T-scores.
- `id` (bigint) - Primary Key
- `test_version` (text) - Required
- `locale` (text) - Required (Default: 'TR')
- `scale_name` (text) - Required
- `gender` (text) - Required (Values: 'erkek', 'kadin')
- `raw_score` (integer) - Required
- `t_score` (integer) - Required (Range: 20 to 120)
- `age_group` (text)
- `notes` (text)
- Constraints: Unique combination of (`test_version`, `locale`, `scale_name`, `gender`, `raw_score`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 11. `t_score_params`
Parameters (mean, standard deviation, K correction) for calculating T-scores.
- `id` (bigint) - Primary Key
- `test_version` (text) - Required (Default: 'MMPI-2')
- `locale` (text) - Required (Default: 'TR')
- `age_group` (text) - Required (Default: 'adult')
- `scale_name` (text) - Required
- `gender` (text) - Required (Values: 'male', 'female')
- `mean_m` (numeric) - Required
- `sd` (numeric) - Required
- `k_correction` (numeric) - Required (Default: 0)
- Constraints: Unique combination of (`test_version`, `locale`, `age_group`, `scale_name`, `gender`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 12. `task_definitions`
Predefined tasks/competencies for psychologist evaluations in reports.
- `id` (uuid) - Primary Key
- `task_number` (integer) - Required
- `task_description` (text)
- `is_active` (boolean) - Default: true
- `category` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 13. `test_results`
Stores the results of tests taken by participants.
- `id` (uuid) - Primary Key
- `participant_id` (uuid) - Foreign Key to `participants`
- `test_answers` (jsonb) - Required (Default: '{}')
- `start_time` (timestamp)
- `end_time` (timestamp)
- `dont_know_count` (integer) - Default: 0
- `completed_questions` (integer) - Default: 0
- `total_questions` (integer) - Default: 567
- `test_type` (varchar) - Default: 'MMPI-2'
- `test_version` (varchar) - Default: '1.0'
- `status` (varchar) - Default: 'completed' (Values: 'started', 'in_progress', 'completed', 'abandoned')
- `created` (timestamp)
- `updated` (timestamp)

### 14. `users`
System users, including psychologists and admins.
- `id` (uuid) - Primary Key
- `email` (varchar) - Required, Unique
- `password_hash` (varchar) - Required
- `role` (varchar) - Required (Default: 'psychologist', Values: 'admin', 'psychologist')
- `name` (varchar)
- `is_active` (boolean) - Default: true
- `last_login` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Triggers

The database uses a function `update_updated_column()` to automatically update the `updated_at` column whenever a row is modified. This is applied to the following tables:
- `users`, `participants`, `test_results`, `questions`, `reports`, `scoring_keys`, `t_score_norms`, `t_score_params`, `mmpi_interpretations`, `kvkk`, `task_definitions`, `settings`.

## PostgREST Auth Infrastructure (`05_postgrest_setup.sql`)

### Database Roles
- `anon` — Unauthenticated access (only executes `api.login()`).
- `authenticated` — Logged-in users (CRUD operations on all tables).

### API Schema (`api`)
- `api.url_b64(data bytea)` → `text` (URL-safe base64 encode)
- `api.sign_jwt(payload jsonb, secret text)` → `text` (HMAC-SHA256 JWT signing)
- `api.login(email text, password text)` → `text` (Email/password login, returns JWT)
- `api.me()` → `jsonb` (Current user info from JWT claims)
- `api.set_jwt_secret()` → `void` (Sets JWT secret via db-pre-request)

### Authorization
- `anon` → `api` schema USAGE, `api.login()` EXECUTE.
- `authenticated` → `public` schema USAGE + all table/sequence privileges, `api` schema USAGE + all functions.

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

## Relationship Diagram (Summary)
```
users ──→ sessions          (1:N)
participants ──→ test_results  (1:N)
participants ──→ reports       (1:N)
test_results ──→ reports       (1:1)
questions ──→ scoring_keys   (1:N, via question_number)
scoring_keys ──→ t_score_norms (N:1, via scale_name)
scoring_keys ──→ t_score_params (N:1, via scale_name)
t_score_params ──→ mmpi_interpretations (N:1, via scale_name)
```

## Migration Order (Production)
```bash
psql -U mmpi_user -d mmpi_db -f 01_schema.sql
psql -U mmpi_user -d mmpi_db -f 02_data.sql
# psql -U mmpi_user -d mmpi_db -f 02_1_taskdefinitions.sql  # requires schema fix
psql -U mmpi_user -d mmpi_db -f 03_setup_admin.sql
psql -U mmpi_user -d mmpi_db -f 05_postgrest_setup.sql
```
