-- Table: public.page_permissions
-- Sayfa bazında rol tabanlı yetki kontrolü için

CREATE TABLE IF NOT EXISTS public.page_permissions
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    page_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    page_title character varying(200) COLLATE pg_catalog."default" NOT NULL,
    admin boolean NOT NULL DEFAULT true,
    psychologist boolean NOT NULL DEFAULT true,
    created timestamp with time zone DEFAULT now(),
    updated timestamp with time zone DEFAULT now(),
    CONSTRAINT page_permissions_pkey PRIMARY KEY (id),
    CONSTRAINT page_permissions_page_name_key UNIQUE (page_name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.page_permissions
    OWNER to anon;

GRANT ALL ON TABLE public.page_permissions TO authenticated;

GRANT ALL ON TABLE public.page_permissions TO anon;

-- Trigger for updated timestamp
DROP TRIGGER IF EXISTS trg_page_permissions_updated ON public.page_permissions;

CREATE OR REPLACE FUNCTION public.update_page_permissions_updated()
    RETURNS trigger
    LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_page_permissions_updated
    BEFORE UPDATE
    ON public.page_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_page_permissions_updated();

-- Default data
INSERT INTO public.page_permissions (page_name, page_title, admin, psychologist) VALUES
    ('dashboard', 'Dashboard', true, true),
    ('test-results', 'Test Sonuçları', true, true),
    ('reports', 'Raporlar', true, true),
    ('questions', 'Sorular', true, true),
    ('task-definitions', 'Görev Tanımları', true, true),
    ('analytics', 'Analitik', true, true),
    ('settings', 'Ayarlar', true, true),
    ('settings-kvkk', 'KVKK Ayarları', true, true),
    ('settings-letters', 'Mektup Şablonları', true, true),
    ('settings-pages', 'Sayfa Yönetimi', true, true),
    ('settings-admins', 'Psikolog Tanımları', true, false),
    ('settings-categories', 'Soru Kategorileri', true, false),
    ('settings-debug', 'Debug Ayarları', true, false)
ON CONFLICT (page_name) DO NOTHING;
