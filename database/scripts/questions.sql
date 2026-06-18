-- Table: public.questions

-- DROP TABLE IF EXISTS public.questions;

CREATE TABLE IF NOT EXISTS public.questions
(
    id integer NOT NULL DEFAULT nextval('questions_id_seq'::regclass),
    question_number integer NOT NULL,
    question_text text COLLATE pg_catalog."default" NOT NULL,
    category_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_question_number_key UNIQUE (question_number),
    CONSTRAINT fk_questions_category FOREIGN KEY (category_id)
        REFERENCES public.question_category (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.questions
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.questions TO authenticated;

GRANT ALL ON TABLE public.questions TO mmpi_user;
-- Index: idx_questions_number

-- DROP INDEX IF EXISTS public.idx_questions_number;

CREATE INDEX IF NOT EXISTS idx_questions_number
    ON public.questions USING btree
    (question_number ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trg_questions_updated

-- DROP TRIGGER IF EXISTS trg_questions_updated ON public.questions;

CREATE OR REPLACE TRIGGER trg_questions_updated
    BEFORE UPDATE 
    ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();