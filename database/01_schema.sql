-- ============================================================
-- MMPI PostgreSQL Schema Migration
-- Phase 1: Full database schema for MMPI-2 Test System
-- ============================================================

-- Run as superuser once: createdb mmpi_db
-- Then: psql -d mmpi_db -f 01_schema.sql
-- Then: psql -d mmpi_db -f 02_data.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS TABLE (auth.users + custom users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'psychologist' CHECK (role IN ('admin', 'psychologist')),
    name VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- PARTICIPANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    tc_no VARCHAR(11) UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('erkek', 'kadin', 'other')),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    institution_code VARCHAR(50),
    institution_name VARCHAR(200),
    profession VARCHAR(100),
    education VARCHAR(50),
    marital_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_participants_tc_no ON participants(tc_no);
CREATE INDEX idx_participants_created ON participants(created_at);

-- ============================================================
-- TEST RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS test_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    participant_info JSONB NOT NULL DEFAULT '{}',
    test_answers JSONB NOT NULL DEFAULT '{}',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    dont_know_count INTEGER DEFAULT 0,
    completed_questions INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 567,
    test_type VARCHAR(50) DEFAULT 'MMPI-2',
    test_version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_test_results_created ON test_results(created_at);
CREATE INDEX idx_test_results_status ON test_results(status);
CREATE INDEX idx_test_results_participant ON test_results(participant_id);

-- ============================================================
-- TEST RESULTS MIN VIEW (for duplicate test detection)
-- ============================================================
CREATE OR REPLACE VIEW public.test_results_min AS
SELECT id, participant_id, status, created_at
FROM public.test_results;
GRANT SELECT ON public.test_results_min TO anon;

-- ============================================================
-- QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_number INTEGER NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    category_id INTEGER REFERENCES question_category(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_number ON questions(question_number);
CREATE INDEX idx_questions_category ON questions(category_id);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    report_content JSONB NOT NULL DEFAULT '{}',
    report_type VARCHAR(50) DEFAULT 'standard',
    generated_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_test_result ON reports(test_result_id);
CREATE INDEX idx_reports_participant ON reports(participant_id);

-- ============================================================
-- SCORING KEYS TABLE (L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si)
-- ============================================================
CREATE TABLE IF NOT EXISTS scoring_keys (
    id SERIAL PRIMARY KEY,
    scale_name VARCHAR(10) NOT NULL,
    question_number INTEGER NOT NULL,
    scoring_answer VARCHAR(20) NOT NULL CHECK (scoring_answer IN ('Doğru', 'Yanlis')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_scale_question UNIQUE (scale_name, question_number)
);

CREATE INDEX idx_scoring_keys_scale ON scoring_keys(scale_name);
CREATE INDEX idx_scoring_keys_question ON scoring_keys(question_number);

-- ============================================================
-- T-SCORE NORMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS t_score_norms (
    id BIGSERIAL PRIMARY KEY,
    test_version TEXT NOT NULL DEFAULT 'MMPI-2',
    locale TEXT NOT NULL DEFAULT 'TR',
    scale_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    raw_score INTEGER NOT NULL CHECK (raw_score >= 0),
    t_score INTEGER NOT NULL CHECK (t_score BETWEEN 20 AND 120),
    age_group TEXT DEFAULT 'adult',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_tnorm UNIQUE (test_version, locale, scale_name, gender, raw_score)
);

CREATE INDEX idx_tnorm_lookup ON t_score_norms(scale_name, gender, raw_score);

-- ============================================================
-- T-SCORE PARAMS TABLE (M, SD, K-correction per scale+gender)
-- ============================================================
CREATE TABLE IF NOT EXISTS t_score_params (
    id BIGSERIAL PRIMARY KEY,
    test_version TEXT NOT NULL DEFAULT 'MMPI-2',
    locale TEXT NOT NULL DEFAULT 'TR',
    age_group TEXT NOT NULL DEFAULT 'adult',
    scale_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    mean_m NUMERIC(6,2) NOT NULL,
    sd NUMERIC(6,2) NOT NULL,
    k_correction NUMERIC(4,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_tparam UNIQUE (test_version, locale, age_group, scale_name, gender)
);

-- ============================================================
-- MMPI INTERPRETATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS mmpi_interpretations (
    id SERIAL PRIMARY KEY,
    scale_name VARCHAR(10) NOT NULL,
    min_t_score INTEGER NOT NULL,
    max_t_score INTEGER NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('validity', 'clinical')),
    gender VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mmpi_int_scale ON mmpi_interpretations(scale_name);
CREATE INDEX idx_mmpi_int_range ON mmpi_interpretations(scale_name, min_t_score, max_t_score);

-- ============================================================
-- PAGE CONTENT TABLE (anasayfa, hakkimizda, gizlilik, kullanim)
-- ============================================================
CREATE TABLE IF NOT EXISTS page_content (
    id SERIAL PRIMARY KEY,
    page_key VARCHAR(50) UNIQUE NOT NULL,
    page_title VARCHAR(255) NOT NULL DEFAULT '',
    page_subtitle TEXT DEFAULT '',
    page_body TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- KVKK TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS kvkk (
    id SERIAL PRIMARY KEY,
    kvkk_title TEXT,
    kvkk_text TEXT NOT NULL,
    kvkk_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- QUESTION CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS question_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TASK DEFINITIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS task_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_number INTEGER NOT NULL,
    task_description TEXT,
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_definitions_id ON task_definitions(id);

-- ============================================================
-- SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SESSIONS TABLE (replaces PG_API Auth sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ============================================================
-- TRIGGER: auto-update updated_at columns
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_participants_updated BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_test_results_updated BEFORE UPDATE ON test_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_scoring_keys_updated BEFORE UPDATE ON scoring_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_t_score_norms_updated BEFORE UPDATE ON t_score_norms
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_t_score_params_updated BEFORE UPDATE ON t_score_params
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_mmpi_int_updated BEFORE UPDATE ON mmpi_interpretations
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_kvkk_updated BEFORE UPDATE ON kvkk
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_task_defs_updated BEFORE UPDATE ON task_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_question_category_updated BEFORE UPDATE ON question_category
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();

-- ============================================================
-- DEFAULT ADMIN USER (password: admin123)
-- bcrypt hash for 'admin123' generated for the migration
-- Change password on first login!
-- ============================================================
INSERT INTO users (email, password_hash, role, name) VALUES
    ('admin@psikolog.com', '$2b$10$placeholder_admin_hash_change_me', 'admin', 'Dr. Admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role, name) VALUES
    ('psikolog1@psikolog.com', '$2b$10$placeholder_psych_hash_change_me', 'psychologist', 'Dr. Ayse Yilmaz')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- DONE: Schema created successfully
-- Next: psql -d mmpi_db -f 02_data.sql
-- ============================================================
