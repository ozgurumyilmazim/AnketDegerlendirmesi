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

--insert into users (role, email, password_hash, name, is_active) VALUES
--('admin', 'admin@psikolog.com', '$2a$06$WqlMW65/Uh8Vxy6Gnlg6oecaH00CSJ2mn/3uueQl.oolKvmgdP54C', 'Dr. Admin', true),
--('psychologist', 'psikolog1@psikolog.com', '$2b$10$placeholder_psych_hash_change_me', 'Dr. Ayse Yilmaz', true);

-- Mark initial users as active

UPDATE users SET is_active = true, name = 'Dr. Admin'
WHERE email = 'admin@psikolog.com' ;

UPDATE users SET is_active = true, name = 'Dr. Ayse Yilmaz'
WHERE email = 'psikolog1@psikolog.com' ;
