-- Migration: Add incomplete-tests page permission
INSERT INTO public.page_permissions (page_name, page_title, admin, psychologist)
VALUES ('incomplete-tests', 'Tamamlanmamış Testler', true, true)
ON CONFLICT (page_name) DO NOTHING;
