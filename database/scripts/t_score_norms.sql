-- Table: public.t_score_norms

-- DROP TABLE IF EXISTS public.t_score_norms;

CREATE TABLE IF NOT EXISTS public.t_score_norms
(
    id bigint NOT NULL DEFAULT nextval('t_score_norms_id_seq'::regclass),
    test_version text COLLATE pg_catalog."default" NOT NULL,
    locale text COLLATE pg_catalog."default" NOT NULL DEFAULT 'TR'::text,
    scale_name text COLLATE pg_catalog."default" NOT NULL,
    gender text COLLATE pg_catalog."default" NOT NULL,
    raw_score integer NOT NULL,
    t_score integer NOT NULL,
    age_group text COLLATE pg_catalog."default",
    notes text COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT t_score_norms_pkey PRIMARY KEY (id),
    CONSTRAINT t_score_norms_test_version_locale_scale_name_gender_raw_sco_key UNIQUE (test_version, locale, scale_name, gender, raw_score),
    CONSTRAINT t_score_norms_gender_check CHECK (gender = ANY (ARRAY['erkek'::text, 'kadin'::text])),
    CONSTRAINT t_score_norms_t_score_check CHECK (t_score >= 20 AND t_score <= 120)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.t_score_norms
    OWNER to admin_user;

GRANT ALL ON TABLE public.t_score_norms TO admin_user;

GRANT ALL ON TABLE public.t_score_norms TO authenticated;

-- Trigger: t_score_norms_set_updated_at

-- DROP TRIGGER IF EXISTS t_score_norms_set_updated_at ON public.t_score_norms;

CREATE OR REPLACE TRIGGER t_score_norms_set_updated_at
    BEFORE UPDATE 
    ON public.t_score_norms
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();