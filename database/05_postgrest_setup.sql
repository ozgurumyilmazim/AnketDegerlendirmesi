-- ============================================================
-- PostgREST Setup for MMPI Test System
-- Run after 01_schema.sql and 02_data.sql
-- Creates database roles, api schema, login function, grants
-- ============================================================

-- Requires pgcrypto (loaded in 01_schema.sql)
-- Requires PostgREST configured with jwt-secret matching app.jwt_secret

-- ============================================================
-- 1. Create database roles for PostgREST
-- ============================================================
-- anon: unauthenticated requests (can only call api.login)
-- authenticated: logged-in users (can CRUD all tables)

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOINHERIT;
  END IF;
END
$$;

-- ============================================================
-- 2. Create api schema for RPC functions
-- ============================================================
CREATE SCHEMA IF NOT EXISTS api;

-- ============================================================
-- 3. Helper: URL-safe base64 encoding (JWT spec)
-- ============================================================
CREATE OR REPLACE FUNCTION api.url_b64(data bytea)
RETURNS text AS $$
BEGIN
  RETURN replace(replace(replace(replace(encode(data, 'base64'), E'\n', ''), '+', '-'), '/', '_'), '=', '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 4. JWT signing function (uses pgcrypto hmac without pgjwt)
-- ============================================================
CREATE OR REPLACE FUNCTION api.sign_jwt(payload jsonb, secret text)
RETURNS text AS $$
DECLARE
  header_b64 text;
  payload_b64 text;
  signature_b64 text;
  signing_input text;
BEGIN
  header_b64 := api.url_b64(convert_to('{"alg":"HS256","typ":"JWT"}', 'utf8'));
  payload_b64 := api.url_b64(convert_to(payload::text, 'utf8'));
  signing_input := header_b64 || '.' || payload_b64;
  signature_b64 := api.url_b64(hmac(signing_input, secret, 'sha256'));
  RETURN signing_input || '.' || signature_b64;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 5. Login function — verifies credentials, returns JWT
-- ============================================================
-- Called by frontend: POST /rpc/login { "email": "...", "password": "..." }
-- Returns a JWT string on success, throws error on failure
CREATE OR REPLACE FUNCTION api.login(email text, password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record public.users%ROWTYPE;
  token text;
  jwt_secret text;
  payload jsonb;
BEGIN
  -- Find user
  SELECT * INTO user_record FROM public.users
    WHERE users.email = login.email AND users.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid email or password';
  END IF;

  -- Verify password (bcrypt hash)
  IF user_record.password_hash != crypt(password, user_record.password_hash) THEN
    RAISE EXCEPTION 'Invalid email or password';
  END IF;

  -- Read JWT secret set by PostgREST db-pre-request
  BEGIN
    jwt_secret := current_setting('app.jwt_secret');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'JWT secret not configured';
  END;

  -- Build JWT payload
  payload := jsonb_build_object(
    'role', 'authenticated',
    'user_id', user_record.id,
    'email', user_record.email,
    'name', user_record.name,
    'role_name', user_record.role,
    'exp', extract(epoch from now() + interval '24 hours')::bigint
  );

  -- Sign and return token
  token := api.sign_jwt(payload, jwt_secret);

  -- Update last login timestamp
  UPDATE public.users SET last_login = NOW() WHERE id = user_record.id;

  RETURN token;
END;
$$;

-- ============================================================
-- 6. Helper to get current user from JWT claims
-- ============================================================
-- Called by frontend: GET /rpc/me (with Bearer token)
-- Returns current user info from the JWT claims set by PostgREST
CREATE OR REPLACE FUNCTION api.me()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'id', current_setting('request.jwt.claims', true)::jsonb ->> 'user_id',
    'email', current_setting('request.jwt.claims', true)::jsonb ->> 'email',
    'name', current_setting('request.jwt.claims', true)::jsonb ->> 'name',
    'role', current_setting('request.jwt.claims', true)::jsonb ->> 'role_name'
  );
$$;

-- ============================================================
-- 7. Create user function — hashes password, inserts into users
-- ============================================================
-- Called by admin panel: POST /rpc/create_user
-- Body: { "name": "...", "email": "...", "password": "...", "role": "admin"|"psychologist" }
-- Returns the created user (without password_hash)
CREATE OR REPLACE FUNCTION api.create_user(name text, email text, password text, role text DEFAULT 'psychologist')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record public.users%ROWTYPE;
BEGIN
  INSERT INTO public.users (name, email, password_hash, role)
  VALUES (create_user.name, create_user.email, crypt(create_user.password, gen_salt('bf')), create_user.role)
  RETURNING * INTO user_record;

  RETURN jsonb_build_object(
    'id', user_record.id,
    'name', user_record.name,
    'email', user_record.email,
    'role', user_record.role
  );
END;
$$;

-- ============================================================
-- 9. Pre-request function: set JWT secret for api.login()
-- ============================================================
-- PostgREST calls this before every request (via db-pre-request config).
-- It makes the JWT signing secret available to api.login() via
-- the custom GUC app.jwt_secret.
--
-- The secret MUST match PostgREST's jwt-secret config.
-- In production, setup-database.sh overrides this with the .env value.
CREATE OR REPLACE FUNCTION api.set_jwt_secret()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.jwt_secret', 'super-secret-jwt-key-change-this-in-production', true);
END;
$$;

-- ============================================================
-- 10. Grants for the anon role
-- ============================================================
GRANT USAGE ON SCHEMA api TO anon;
GRANT EXECUTE ON FUNCTION api.login(text, text) TO anon;

-- ============================================================
-- 11. Grants for the authenticated role
-- ============================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;

GRANT USAGE ON SCHEMA api TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO authenticated;

-- ============================================================
-- 12. Grant public.users select to anon (so login function can read)
-- ============================================================
-- The login function is SECURITY DEFINER (runs as owner), so it can
-- read public.users even without explicit grant to anon.
-- No additional grant needed.

-- ============================================================
-- Done. Start PostgREST:
--   postgrest postgrest.conf
-- ============================================================
