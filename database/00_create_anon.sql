-- 00_create_anon.sql
-- Ensure the anon role exists for PostgREST
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
       CREATE ROLE anon NOINHERIT;
   END IF;
END $$;
