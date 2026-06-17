
-- Table: public.scoring_keys

-- DROP TABLE IF EXISTS public.scoring_keys;

CREATE TABLE IF NOT EXISTS public.scoring_keys
(
    id integer NOT NULL DEFAULT nextval('scoring_keys_id_seq'::regclass),
    scale_name character varying(10) COLLATE pg_catalog."default" NOT NULL,
    question_number integer NOT NULL,
    scoring_answer character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scoring_keys_pkey PRIMARY KEY (id),
    CONSTRAINT uk_scale_question UNIQUE (scale_name, question_number),
    CONSTRAINT scoring_keys_scoring_answer_check CHECK (scoring_answer::text = ANY (ARRAY['Doğru'::character varying, 'Yanlis'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.scoring_keys
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.scoring_keys TO authenticated;

GRANT ALL ON TABLE public.scoring_keys TO mmpi_user;
-- Index: idx_scoring_keys_question

-- DROP INDEX IF EXISTS public.idx_scoring_keys_question;

CREATE INDEX IF NOT EXISTS idx_scoring_keys_question
    ON public.scoring_keys USING btree
    (question_number ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_scoring_keys_scale

-- DROP INDEX IF EXISTS public.idx_scoring_keys_scale;

CREATE INDEX IF NOT EXISTS idx_scoring_keys_scale
    ON public.scoring_keys USING btree
    (scale_name COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trg_scoring_keys_updated

-- DROP TRIGGER IF EXISTS trg_scoring_keys_updated ON public.scoring_keys;

CREATE OR REPLACE TRIGGER trg_scoring_keys_updated
    BEFORE UPDATE 
    ON public.scoring_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();