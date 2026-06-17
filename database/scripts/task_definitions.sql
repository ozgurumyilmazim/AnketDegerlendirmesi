-- Table: public.task_definitions

-- DROP TABLE IF EXISTS public.task_definitions;

CREATE TABLE IF NOT EXISTS public.task_definitions
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    task_number integer NOT NULL,
    task_description text COLLATE pg_catalog."default",
    is_active boolean DEFAULT true,
    category character varying(100) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT task_definitions_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.task_definitions
    OWNER to admin_user;

GRANT ALL ON TABLE public.task_definitions TO admin_user;

GRANT ALL ON TABLE public.task_definitions TO authenticated;
-- Index: idx_task_definitions_id

-- DROP INDEX IF EXISTS public.idx_task_definitions_id;

CREATE INDEX IF NOT EXISTS idx_task_definitions_id
    ON public.task_definitions USING btree
    (id ASC NULLS LAST)
    TABLESPACE pg_default;