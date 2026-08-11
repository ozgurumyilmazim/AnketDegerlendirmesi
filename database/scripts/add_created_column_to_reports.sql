-- Migration: add 'created' column to reports table for compatibility with PostgREST queries
-- This script adds a new column 'created' mirroring the existing 'created_at' timestamp.
-- It also populates existing rows and ensures future inserts default to now().
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS created timestamp with time zone DEFAULT now();

-- Populate the new column for existing records using the current created_at values.
UPDATE public.reports SET created = created_at WHERE created IS NULL;

-- Ensure the trigger that updates timestamp columns also updates the new 'created' column if needed.
-- The existing trigger function 'update_updated_column' handles 'updated' and 'updated_at'.
-- If you want 'created' to be set on INSERT, you can rely on the default above. No further changes required.

COMMIT;
