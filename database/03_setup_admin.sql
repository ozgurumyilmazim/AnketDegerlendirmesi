-- ============================================================
-- MMPI Admin User Setup
-- Generates proper bcrypt password hashes
-- ============================================================
-- Requires: pgcrypto extension
-- Run AFTER: 01_schema.sql, 02_data.sql
-- ============================================================

-- NOTE: This requires the pgcrypto extension with bcrypt support.
-- If pgcrypto does not support bcrypt in your PostgreSQL version,
-- generate hashes with a Node.js script instead (see below).

-- Option A: Use pgcrypto (if available with bcrypt support)
-- UPDATE users SET password_hash = crypt('admin123', gen_salt('bf', 10))
-- WHERE email = 'admin@psikolog.com';
--
-- UPDATE users SET password_hash = crypt('psik123', gen_salt('bf', 10))
-- WHERE email = 'psikolog1@psikolog.com';

-- Option B: Generate hashes with Node.js
-- Run this separately:
-- node -e "const bcrypt = require('bcrypt'); const pwd = bcrypt.hashSync('admin123', 10); console.log(pwd);"

-- Mark initial users as active
UPDATE users SET is_active = true, name = 'Dr. Admin'
WHERE email = 'admin@psikolog.com' AND (password_hash = '$2b$10$placeholder_admin_hash_change_me' OR password_hash IS NULL);

UPDATE users SET is_active = true, name = 'Dr. Ayse Yilmaz'
WHERE email = 'psikolog1@psikolog.com' AND (password_hash = '$2b$10$placeholder_psych_hash_change_me' OR password_hash IS NULL);
