-- Migration: Add session_code and current_index to test_results
ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS session_code VARCHAR(11);
ALTER TABLE public.test_results ADD COLUMN IF NOT EXISTS current_index INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_test_results_session_code ON public.test_results(session_code);

-- anon needs SELECT on test_results for participant resume lookup
GRANT SELECT ON public.test_results TO anon;
