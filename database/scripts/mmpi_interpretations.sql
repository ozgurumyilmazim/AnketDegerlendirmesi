-- Table: public.mmpi_interpretations

-- DROP TABLE IF EXISTS public.mmpi_interpretations;

CREATE TABLE IF NOT EXISTS public.mmpi_interpretations
(
    id integer NOT NULL DEFAULT nextval('mmpi_interpretations_id_seq'::regclass),
    scale_name character varying(10) COLLATE pg_catalog."default" NOT NULL,
    min_t_score integer NOT NULL,
    max_t_score integer NOT NULL,
    description text COLLATE pg_catalog."default" NOT NULL,
    category character varying(20) COLLATE pg_catalog."default" NOT NULL,
    gender character varying(10) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT mmpi_interpretations_pkey PRIMARY KEY (id),
    CONSTRAINT mmpi_interpretations_category_check CHECK (category::text = ANY (ARRAY['validity'::character varying, 'clinical'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.mmpi_interpretations
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.mmpi_interpretations TO authenticated;

GRANT ALL ON TABLE public.mmpi_interpretations TO mmpi_user;
-- Index: idx_mmpi_int_range

-- DROP INDEX IF EXISTS public.idx_mmpi_int_range;

CREATE INDEX IF NOT EXISTS idx_mmpi_int_range
    ON public.mmpi_interpretations USING btree
    (scale_name COLLATE pg_catalog."default" ASC NULLS LAST, min_t_score ASC NULLS LAST, max_t_score ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_mmpi_int_scale

-- DROP INDEX IF EXISTS public.idx_mmpi_int_scale;

CREATE INDEX IF NOT EXISTS idx_mmpi_int_scale
    ON public.mmpi_interpretations USING btree
    (scale_name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trg_mmpi_int_updated

-- DROP TRIGGER IF EXISTS trg_mmpi_int_updated ON public.mmpi_interpretations;

CREATE OR REPLACE TRIGGER trg_mmpi_int_updated
    BEFORE UPDATE 
    ON public.mmpi_interpretations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();