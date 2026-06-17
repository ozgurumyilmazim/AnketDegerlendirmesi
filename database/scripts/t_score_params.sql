-- Table: public.t_score_params

-- DROP TABLE IF EXISTS public.t_score_params;

CREATE TABLE IF NOT EXISTS public.t_score_params
(
    id bigint NOT NULL DEFAULT nextval('t_score_params_id_seq'::regclass),
    test_version text COLLATE pg_catalog."default" NOT NULL DEFAULT 'MMPI-2'::text,
    locale text COLLATE pg_catalog."default" NOT NULL DEFAULT 'TR'::text,
    age_group text COLLATE pg_catalog."default" NOT NULL DEFAULT 'adult'::text,
    scale_name text COLLATE pg_catalog."default" NOT NULL,
    gender text COLLATE pg_catalog."default" NOT NULL,
    mean_m numeric(6,2) NOT NULL,
    sd numeric(6,2) NOT NULL,
    k_correction numeric(4,2) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT t_score_params_pkey PRIMARY KEY (id),
    CONSTRAINT uq_tparam UNIQUE (test_version, locale, age_group, scale_name, gender),
    CONSTRAINT t_score_params_gender_check CHECK (gender = ANY (ARRAY['male'::text, 'female'::text]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.t_score_params
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.t_score_params TO authenticated;

GRANT ALL ON TABLE public.t_score_params TO mmpi_user;

-- Trigger: trg_t_score_params_updated

-- DROP TRIGGER IF EXISTS trg_t_score_params_updated ON public.t_score_params;

CREATE OR REPLACE TRIGGER trg_t_score_params_updated
    BEFORE UPDATE 
    ON public.t_score_params
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();