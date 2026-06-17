-- Table: public.kvkk

-- DROP TABLE IF EXISTS public.kvkk;

CREATE TABLE IF NOT EXISTS public.kvkk
(
    id integer NOT NULL DEFAULT nextval('kvkk_id_seq'::regclass),
    kvkk_title text COLLATE pg_catalog."default",
    kvkk_text text COLLATE pg_catalog."default" NOT NULL,
    kvkk_required boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT kvkk_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.kvkk
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.kvkk TO authenticated;

GRANT ALL ON TABLE public.kvkk TO mmpi_user;

-- Trigger: trg_kvkk_updated

-- DROP TRIGGER IF EXISTS trg_kvkk_updated ON public.kvkk;

CREATE OR REPLACE TRIGGER trg_kvkk_updated
    BEFORE UPDATE 
    ON public.kvkk
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();