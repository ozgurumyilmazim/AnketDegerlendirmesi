-- ============================================================
-- Migration 11: Remove institution_name from participants
-- Institution name is now looked up from the institutions
-- reference table via institution_code
-- ============================================================

ALTER TABLE IF EXISTS public.participants
    DROP COLUMN IF EXISTS institution_name;
