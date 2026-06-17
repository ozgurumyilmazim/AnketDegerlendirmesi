-- Table: public.settings

-- DROP TABLE IF EXISTS public.settings;

CREATE TABLE IF NOT EXISTS public.settings
(
    id integer NOT NULL DEFAULT nextval('settings_id_seq'::regclass),
    setting_key character varying(100) COLLATE pg_catalog."default" NOT NULL,
    setting_value text COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT settings_pkey PRIMARY KEY (id),
    CONSTRAINT settings_setting_key_key UNIQUE (setting_key)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.settings
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.settings TO authenticated;

GRANT ALL ON TABLE public.settings TO mmpi_user;

-- Trigger: trg_settings_updated

-- DROP TRIGGER IF EXISTS trg_settings_updated ON public.settings;

CREATE OR REPLACE TRIGGER trg_settings_updated
    BEFORE UPDATE 
    ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();