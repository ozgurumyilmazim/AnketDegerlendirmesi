-- ============================================================
-- Personal Info Reference Tables Migration
-- Creates reference tables for: genders, professions,
-- education_levels, marital_statuses, institutions
-- ============================================================

-- ============================================================
-- 1. GENDERS TABLE (Cinsiyet)
-- ============================================================
CREATE TABLE IF NOT EXISTS genders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO genders (name, code, sort_order) VALUES
    ('Erkek', 'erkek', 1),
    ('Kadın', 'kadin', 2),
    ('Diğer', 'other', 3)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. PROFESSIONS TABLE (Meslek)
-- ============================================================
CREATE TABLE IF NOT EXISTS professions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO professions (name, sort_order) VALUES
    ('Öğrenci', 1),
    ('Öğretmen', 2),
    ('Doktor', 3),
    ('Hemşire', 4),
    ('Mühendis', 5),
    ('Avukat', 6),
    ('Mimar', 7),
    ('İşletmeci', 8),
    ('İktisatçı', 9),
    ('Memur', 10),
    ('İşçi', 11),
    ('Emekli', 12),
    ('Ev Hanımı', 13),
    ('Serbest Meslek', 14),
    ('Güvenlik Görevlisi', 15),
    ('Şoför', 16),
    ('Teknisyen', 17),
    ('Esnaf', 18),
    ('Çiftçi', 19),
    ('Diğer', 20)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. EDUCATION LEVELS TABLE (Eğitim Seviyesi)
-- ============================================================
CREATE TABLE IF NOT EXISTS education_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO education_levels (name, sort_order) VALUES
    ('İlkokul', 1),
    ('Ortaokul', 2),
    ('Lise', 3),
    ('Ön Lisans', 4),
    ('Lisans', 5),
    ('Yüksek Lisans', 6),
    ('Doktora', 7),
    ('Profesörlük', 8)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 4. MARITAL STATUSES TABLE (Medeni Durum)
-- ============================================================
CREATE TABLE IF NOT EXISTS marital_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO marital_statuses (name, sort_order) VALUES
    ('Bekar', 1),
    ('Evli', 2),
    ('Boşanmış', 3),
    ('Dul', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 5. INSTITUTIONS TABLE (Kurum)
-- ============================================================
CREATE TABLE IF NOT EXISTS institutions (
    id SERIAL PRIMARY KEY,
    institution_code VARCHAR(50) UNIQUE NOT NULL,
    institution_name VARCHAR(200) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO institutions (institution_code, institution_name, sort_order) VALUES
    ('KUR001', 'İstanbul Üniversitesi', 1),
    ('KUR002', 'Ankara Üniversitesi', 2),
    ('KUR003', 'Ege Üniversitesi', 3),
    ('KUR004', 'Bilkent Üniversitesi', 4),
    ('KUR005', 'ODTÜ', 5)
ON CONFLICT (institution_code) DO NOTHING;

-- ============================================================
-- TRIGGERS for auto-update updated columns
-- ============================================================
CREATE TRIGGER trg_genders_updated BEFORE UPDATE ON genders
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_professions_updated BEFORE UPDATE ON professions
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_education_levels_updated BEFORE UPDATE ON education_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_marital_statuses_updated BEFORE UPDATE ON marital_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();
CREATE TRIGGER trg_institutions_updated BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_column();

-- ============================================================
-- GRANTS
-- ============================================================
GRANT ALL ON TABLE genders TO authenticated;
GRANT ALL ON TABLE genders TO anon;
GRANT ALL ON TABLE professions TO authenticated;
GRANT ALL ON TABLE professions TO anon;
GRANT ALL ON TABLE education_levels TO authenticated;
GRANT ALL ON TABLE education_levels TO anon;
GRANT ALL ON TABLE marital_statuses TO authenticated;
GRANT ALL ON TABLE marital_statuses TO anon;
GRANT ALL ON TABLE institutions TO authenticated;
GRANT ALL ON TABLE institutions TO anon;

-- Explicit SELECT grants for anon (personal-info form needs to read these)
GRANT SELECT ON TABLE genders TO anon;
GRANT SELECT ON TABLE professions TO anon;
GRANT SELECT ON TABLE education_levels TO anon;
GRANT SELECT ON TABLE marital_statuses TO anon;
GRANT SELECT ON TABLE institutions TO anon;

-- ============================================================
-- PAGE PERMISSIONS for admin settings page
-- ============================================================
INSERT INTO public.page_permissions (page_name, page_title, admin, psychologist) VALUES
    ('settings-personal-info', 'Kisisel Bilgi Referanslari', true, false)
ON CONFLICT (page_name) DO NOTHING;
