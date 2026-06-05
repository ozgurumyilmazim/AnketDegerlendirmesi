-- MMPI Ölçekleri için T puanı aralıklarına göre açıklamalar tablosu
CREATE TABLE mmpi_interpretations (
    id SERIAL PRIMARY KEY,
    scale_name VARCHAR(10) NOT NULL, -- L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si
    min_t_score INTEGER NOT NULL,
    max_t_score INTEGER NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(20) NOT NULL, -- 'validity' (L,F,K için) veya 'clinical' (diğerleri için)
    gender VARCHAR(10), -- Mf ölçeği için 'male' veya 'female', diğerleri için NULL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX idx_mmpi_interpretations_scale ON mmpi_interpretations(scale_name);
CREATE INDEX idx_mmpi_interpretations_score_range ON mmpi_interpretations(scale_name, min_t_score, max_t_score);
CREATE INDEX idx_mmpi_interpretations_category ON mmpi_interpretations(category);

-- Tablo açıklaması
COMMENT ON TABLE mmpi_interpretations IS 'MMPI ölçekleri için T puanı aralıklarına göre psikolojik yorumlar ve açıklamalar';
COMMENT ON COLUMN mmpi_interpretations.scale_name IS 'MMPI ölçek adı (L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si)';
COMMENT ON COLUMN mmpi_interpretations.min_t_score IS 'T puanı aralığının alt sınırı';
COMMENT ON COLUMN mmpi_interpretations.max_t_score IS 'T puanı aralığının üst sınırı';
COMMENT ON COLUMN mmpi_interpretations.description IS 'T puanı aralığı için psikolojik yorum ve açıklama';
COMMENT ON COLUMN mmpi_interpretations.category IS 'Ölçek kategorisi: validity (geçerlilik) veya clinical (klinik)';
COMMENT ON COLUMN mmpi_interpretations.gender IS 'Mf ölçeği için cinsiyet (male/female), diğer ölçekler için NULL';