-- Add session_code and current_index columns for save/resume functionality
-- Generates an 11-character code shown to users so they can resume later

ALTER TABLE IF EXISTS public.test_results
ADD COLUMN IF NOT EXISTS session_code character varying(11) COLLATE pg_catalog."default";

ALTER TABLE IF EXISTS public.test_results
ADD COLUMN IF NOT EXISTS current_index integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_test_results_session_code
ON public.test_results USING btree
(session_code COLLATE pg_catalog."default" ASC NULLS LAST)
TABLESPACE pg_default;

GRANT ALL ON TABLE public.test_results TO authenticated;
GRANT ALL ON TABLE public.test_results TO mmpi_user;
