# Database Schema — MMPI-2 Psikolojik Test Sistemi

## Genel Bakış

PostgreSQL veritabanı, MMPI-2 test uygulaması için 12 tablo, indeksler, triggerlar ve PostgREST auth altyapısı içerir. Migration sırası:

```
01_schema.sql     → Tablolar, indeksler, triggerlar
02_data.sql       → Referans verileri (sorular, puanlama anahtarları, vs.)
02_1_*.sql        → Task tanımları (isteğe bağlı)
03_setup_admin.sql → Admin kullanıcı şifreleri
05_postgrest_setup.sql → PostgREST rolleri, JWT auth fonksiyonları
```

---

## Tablolar

### 1. `users` — Admin/Psychologist kullanıcıları

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | Benzersiz kullanıcı ID |
| `email` | `VARCHAR(255)` | `UNIQUE NOT NULL` | E-posta adresi |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt hash |
| `role` | `VARCHAR(20)` | `NOT NULL DEFAULT 'psychologist' CHECK (admin, psychologist)` | Yetki rolü |
| `name` | `VARCHAR(200)` | | Ad soyad |
| `is_active` | `BOOLEAN` | `DEFAULT true` | Aktif mi |
| `last_login` | `TIMESTAMPTZ` | | Son giriş zamanı |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `email`, `role`

---

### 2. `participants` — Test katılımcıları

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | |
| `last_name` | `VARCHAR(100)` | `NOT NULL` | |
| `tc_no` | `VARCHAR(11)` | `UNIQUE` | T.C. Kimlik No |
| `gender` | `VARCHAR(10)` | `CHECK (erkek, kadin, other)` | |
| `age` | `INTEGER` | `CHECK (0–150)` | |
| `institution_code` | `VARCHAR(50)` | | Kurum kodu |
| `institution_name` | `VARCHAR(200)` | | Kurum adı |
| `profession` | `VARCHAR(100)` | | Meslek |
| `education` | `VARCHAR(50)` | | Eğitim durumu |
| `marital_status` | `VARCHAR(50)` | | Medeni durum |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `tc_no`, `created_at`

---

### 3. `test_results` — Test sonuç/cevap kayıtları

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `participant_id` | `UUID` | `FK → participants(id) ON DELETE SET NULL` | Katılımcı |
| `participant_info` | `JSONB` | `NOT NULL DEFAULT '{}'` | Anlık katılımcı bilgisi (denormalize) |
| `test_answers` | `JSONB` | `NOT NULL DEFAULT '{}'` | `{soru_no: "Doğru"|"Yanlış"|"Bilmiyorum"}` |
| `start_time` | `TIMESTAMPTZ` | | Test başlangıç |
| `end_time` | `TIMESTAMPTZ` | | Test bitiş |
| `dont_know_count` | `INTEGER` | `DEFAULT 0` | Bilmiyorum sayısı |
| `completed_questions` | `INTEGER` | `DEFAULT 0` | Tamamlanan soru |
| `total_questions` | `INTEGER` | `DEFAULT 567` | Toplam soru |
| `test_type` | `VARCHAR(50)` | `DEFAULT 'MMPI-2'` | |
| `test_version` | `VARCHAR(20)` | `DEFAULT '1.0'` | |
| `status` | `VARCHAR(20)` | `DEFAULT 'completed' CHECK (started, in_progress, completed, abandoned)` | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `created_at`, `status`, `participant_id`

---

### 4. `questions` — MMPI-2 soru bankası (567 soru)

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `SERIAL` | `PK` | |
| `question_number` | `INTEGER` | `UNIQUE NOT NULL` | Soru numarası (1–567) |
| `question_text` | `TEXT` | `NOT NULL` | Soru metni (Türkçe) |
| `category` | `VARCHAR(100)` | | Kategori (Genel, Aile, Sağlık, vs.) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `question_number`

---

### 5. `reports` — Oluşturulan test raporları

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `test_result_id` | `UUID` | `FK → test_results(id) ON DELETE CASCADE` | |
| `participant_id` | `UUID` | `FK → participants(id) ON DELETE SET NULL` | |
| `report_content` | `JSONB` | `NOT NULL DEFAULT '{}'` | Rapor içeriği (T-score, yorumlar) |
| `report_type` | `VARCHAR(50)` | `DEFAULT 'standard'` | |
| `generated_by` | `VARCHAR(100)` | | Oluşturan kullanıcı |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `test_result_id`, `participant_id`

---

### 6. `scoring_keys` — MMPI skalaları için puanlama anahtarları

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `SERIAL` | `PK` | |
| `scale_name` | `VARCHAR(10)` | `NOT NULL` | Skala adı (L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si) |
| `question_number` | `INTEGER` | `NOT NULL` | Soru numarası |
| `scoring_answer` | `VARCHAR(20)` | `NOT NULL CHECK (Doğru, Yanlis)` | Hangi cevap puanlanır |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**Kısıtlamalar:** `UNIQUE (scale_name, question_number)`
**İndeksler:** `scale_name`, `question_number`

---

### 7. `t_score_norms` — T-skoru norm tablosu (ham → T dönüşümü)

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `test_version` | `TEXT` | `NOT NULL DEFAULT 'MMPI-2'` | |
| `locale` | `TEXT` | `NOT NULL DEFAULT 'TR'` | |
| `scale_name` | `TEXT` | `NOT NULL` | |
| `gender` | `TEXT` | `NOT NULL CHECK (male, female)` | |
| `raw_score` | `INTEGER` | `NOT NULL CHECK (>=0)` | Ham puan |
| `t_score` | `INTEGER` | `NOT NULL CHECK (20–120)` | T-puanı |
| `age_group` | `TEXT` | `DEFAULT 'adult'` | |
| `notes` | `TEXT` | | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**Kısıtlamalar:** `UNIQUE (test_version, locale, scale_name, gender, raw_score)`
**İndeksler:** `(scale_name, gender, raw_score)`

---

### 8. `t_score_params` — T-skoru parametreleri (M, SD, K-düzeltmesi)

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PK` | |
| `test_version` | `TEXT` | `NOT NULL DEFAULT 'MMPI-2'` | |
| `locale` | `TEXT` | `NOT NULL DEFAULT 'TR'` | |
| `age_group` | `TEXT` | `NOT NULL DEFAULT 'adult'` | |
| `scale_name` | `TEXT` | `NOT NULL` | |
| `gender` | `TEXT` | `NOT NULL CHECK (male, female)` | |
| `mean_m` | `NUMERIC(6,2)` | `NOT NULL` | Ortalama (M) |
| `sd` | `NUMERIC(6,2)` | `NOT NULL` | Standart sapma (SD) |
| `k_correction` | `NUMERIC(4,2)` | `NOT NULL DEFAULT 0` | K-düzeltme katsayısı |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**Kısıtlamalar:** `UNIQUE (test_version, locale, age_group, scale_name, gender)`

---

### 9. `mmpi_interpretations` — T-skoru aralıklarına göre yorumlar

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `SERIAL` | `PK` | |
| `scale_name` | `VARCHAR(10)` | `NOT NULL` | |
| `min_t_score` | `INTEGER` | `NOT NULL` | |
| `max_t_score` | `INTEGER` | `NOT NULL` | |
| `description` | `TEXT` | `NOT NULL` | Yorum metni (Türkçe) |
| `category` | `VARCHAR(20)` | `NOT NULL CHECK (validity, clinical)` | Geçerlik veya klinik |
| `gender` | `VARCHAR(10)` | | Cinsiyete özel yorum (opsiyonel) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `scale_name`, `(scale_name, min_t_score, max_t_score)`

---

### 10. `page_content` — Statik sayfa içerikleri (CMS)

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `SERIAL` | `PK` | |
| `page_key` | `VARCHAR(50)` | `UNIQUE NOT NULL` | Sayfa anahtarı (gizlilik, kullanim, hakkimizda) |
| `page_title` | `VARCHAR(255)` | `NOT NULL DEFAULT ''` | |
| `page_subtitle` | `TEXT` | | |
| `page_body` | `TEXT` | | HTML içerik |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

---

### 11. `kvkk` — KVKK Aydınlatma Metni

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `SERIAL` | `PK` | |
| `kvkk_title` | `TEXT` | | Başlık |
| `kvkk_text` | `TEXT` | `NOT NULL` | HTML metin |
| `kvkk_required` | `BOOLEAN` | `DEFAULT true` | Zorunlu onay |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

---

### 12. `task_definitions` — Görev tanımları

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `title` | `VARCHAR(255)` | `NOT NULL` | |
| `description` | `TEXT` | | |
| `category` | `VARCHAR(100)` | | |
| `assigned_to` | `VARCHAR(100)` | | |
| `status` | `VARCHAR(20)` | `DEFAULT 'pending' CHECK (pending, in_progress, completed, cancelled)` | |
| `due_date` | `DATE` | | |
| `created_by` | `VARCHAR(100)` | | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `status`

> **⚠ Not:** `02_1_taskdefinitions.sql` dosyasındaki INSERT sorgusu, tablo şemasıyla **uyuşmayan** kolon adları kullanır (`task_number`, `task_description`, `is_active`). Bu sorgu mevcut şemaya göre çalışmaz — düzeltilmesi gerekir.

---

### 13. `settings` — Uygulama ayarları (key-value)

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `SERIAL` | `PK` | |
| `setting_key` | `VARCHAR(100)` | `UNIQUE NOT NULL` | Ayar anahtarı |
| `setting_value` | `TEXT` | | Ayar değeri |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

---

### 14. `sessions` — JWT oturum yönetimi (opsiyonel)

| Kolon | Tip | Kısıtlama | Açıklama |
|---|---|---|---|
| `id` | `UUID` | `PK DEFAULT gen_random_uuid()` | |
| `user_id` | `UUID` | `FK → users(id) ON DELETE CASCADE NOT NULL` | |
| `token` | `VARCHAR(512)` | `UNIQUE NOT NULL` | JWT token |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | |

**İndeksler:** `token`, `user_id`

---

## Triggerlar

Tüm tablolarda `updated_at` kolonunu otomatik güncelleyen `update_updated_column()` fonksiyonu:

- `trg_users_updated` — users
- `trg_participants_updated` — participants
- `trg_test_results_updated` — test_results
- `trg_questions_updated` — questions
- `trg_reports_updated` — reports
- `trg_scoring_keys_updated` — scoring_keys
- `trg_t_score_norms_updated` — t_score_norms
- `trg_t_score_params_updated` — t_score_params
- `trg_mmpi_int_updated` — mmpi_interpretations
- `trg_kvkk_updated` — kvkk
- `trg_task_defs_updated` — task_definitions
- `trg_settings_updated` — settings

---

## PostgREST Auth Altyapısı (`05_postgrest_setup.sql`)

### Database Rolleri

- `anon` — Kimlik doğrulamasız (sadece `api.login()`)
- `authenticated` — Giriş yapmış kullanıcılar (tüm tablolarda CRUD)

### API Schema (`api`)

| Fonksiyon | Açıklama |
|---|---|
| `api.url_b64(data bytea)` → `text` | URL-safe base64 encode |
| `api.sign_jwt(payload jsonb, secret text)` → `text` | HMAC-SHA256 ile JWT imzalama |
| `api.login(email text, password text)` → `text` | E-posta/şifre ile giriş, JWT döndürür |
| `api.me()` → `jsonb` | Mevcut kullanıcı bilgisi (JWT claim'lerinden) |
| `api.set_jwt_secret()` → `void` | db-pre-request ile JWT secret'ı set eder |

### Yetkilendirme

- `anon` → `api` schema USAGE, `api.login()` EXECUTE
- `authenticated` → `public` schema USAGE + tüm tablo/sequence yetkileri, `api` schema USAGE + tüm fonksiyonlar

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

---

## İlişki Diyagramı (Özet)

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

---

## Migration Sırası (Production)

```bash
psql -U mmpi_user -d mmpi_db -f 01_schema.sql
psql -U mmpi_user -d mmpi_db -f 02_data.sql
# psql -U mmpi_user -d mmpi_db -f 02_1_taskdefinitions.sql  # requires schema fix
psql -U mmpi_user -d mmpi_db -f 03_setup_admin.sql
psql -U mmpi_user -d mmpi_db -f 05_postgrest_setup.sql
```
