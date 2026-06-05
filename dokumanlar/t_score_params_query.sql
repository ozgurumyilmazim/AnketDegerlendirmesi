-- Tablo: cinsiyet + ölçek için M, SD ve K düzeltme katsayısı
CREATE TABLE IF NOT EXISTS t_score_params (
  id           BIGSERIAL PRIMARY KEY,
  test_version TEXT        NOT NULL DEFAULT 'MMPI-2',
  locale       TEXT        NOT NULL DEFAULT 'TR',
  age_group    TEXT        NOT NULL DEFAULT 'adult',
  scale_name   TEXT        NOT NULL,                      -- L, F, K, Hs, D, Hy, Pd, Mf, Pa, Pt, Sc, Ma, Si
  gender       TEXT        NOT NULL CHECK (gender IN ('male','female')),
  mean_m       NUMERIC(6,2) NOT NULL,                     -- M
  sd           NUMERIC(6,2) NOT NULL,                     -- SD
  k_correction NUMERIC(4,2) NOT NULL DEFAULT 0,           -- Hs:+0.5K, Pd:+0.4K, Pt:+1.0K, Sc:+1.0K, Ma:+0.2K
  created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (test_version, locale, age_group, scale_name, gender)
);

-- Erkek
INSERT INTO t_score_params (scale_name, gender, mean_m, sd, k_correction)
VALUES
('L',  'male',  6.45, 2.74, 0.00),
('F',  'male',  8.30, 4.62, 0.00),
('K',  'male', 13.98, 4.65, 0.00),
('Hs', 'male', 13.19, 4.07, 0.50),
('D',  'male', 20.63, 4.76, 0.00),
('Hy', 'male', 19.31, 4.71, 0.00),
('Pd', 'male', 22.22, 4.45, 0.40),
('Mf', 'male', 29.21, 3.82, 0.00),
('Pa', 'male', 11.12, 4.03, 0.00),
('Pt', 'male', 27.90, 6.30, 1.00),
('Sc', 'male', 29.82, 9.05, 1.00),
('Ma', 'male', 19.96, 4.40, 0.20),
('Si', 'male', 25.86, 7.97, 0.00)
ON CONFLICT (test_version, locale, age_group, scale_name, gender)
DO UPDATE SET mean_m = EXCLUDED.mean_m, sd = EXCLUDED.sd, k_correction = EXCLUDED.k_correction;

-- Kadın
INSERT INTO t_score_params (scale_name, gender, mean_m, sd, k_correction)
VALUES
('L',  'female',  6.00, 2.25, 0.00),
('F',  'female',  9.38, 5.16, 0.00),
('K',  'female', 11.82, 3.80, 0.00),
('Hs', 'female', 15.89, 4.88, 0.50),
('D',  'female', 23.86, 5.08, 0.00),
('Hy', 'female', 18.12, 5.31, 0.00),
('Pd', 'female', 22.84, 4.51, 0.40),
('Mf', 'female', 32.98, 3.67, 0.00),
('Pa', 'female', 11.93, 4.17, 0.00),
('Pt', 'female', 29.20, 6.59, 1.00),
('Sc', 'female', 31.06, 8.20, 1.00),
('Ma', 'female', 19.72, 4.36, 0.20),
('Si', 'female', 29.88, 7.52, 0.00)
ON CONFLICT (test_version, locale, age_group, scale_name, gender)
DO UPDATE SET mean_m = EXCLUDED.mean_m, sd = EXCLUDED.sd, k_correction = EXCLUDED.k_correction;