-- Table: public.questions

-- DROP TABLE IF EXISTS public.questions;

CREATE TABLE IF NOT EXISTS public.questions
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    question_number integer NOT NULL,
    question_text text COLLATE pg_catalog."default" NOT NULL,
    category_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT questions_pkey PRIMARY KEY (id),
    CONSTRAINT questions_question_number_key UNIQUE (question_number),
    CONSTRAINT questions_category_id_fkey FOREIGN KEY (category_id)
        REFERENCES public.question_category (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.questions
    OWNER to admin_user;

GRANT ALL ON TABLE public.questions TO admin_user;

GRANT ALL ON TABLE public.questions TO authenticated;
-- Index: idx_questions_category

-- DROP INDEX IF EXISTS public.idx_questions_category;

CREATE INDEX IF NOT EXISTS idx_questions_category
    ON public.questions USING btree
    (category_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_questions_number

-- DROP INDEX IF EXISTS public.idx_questions_number;

CREATE INDEX IF NOT EXISTS idx_questions_number
    ON public.questions USING btree
    (question_number ASC NULLS LAST)
    TABLESPACE pg_default;