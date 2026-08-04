-- Migration script to fix update_updated_column trigger function
-- Supports tables using either 'updated' or 'updated_at' timestamp columns

CREATE OR REPLACE FUNCTION public.update_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        NEW.updated = NOW();
    EXCEPTION WHEN undefined_column THEN
    END;
    BEGIN
        NEW.updated_at = NOW();
    EXCEPTION WHEN undefined_column THEN
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
