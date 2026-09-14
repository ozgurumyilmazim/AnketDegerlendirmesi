-- Migration: Add settings-interpretations page permission
INSERT INTO public.page_permissions (page_name, page_title, admin, psychologist)
VALUES ('settings-interpretations', 'MMPI Yorum Tanımları', true, false)
ON CONFLICT (page_name) DO NOTHING;
