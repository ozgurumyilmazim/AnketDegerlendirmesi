-- Table: public.participants

-- DROP TABLE IF EXISTS public.participants;

CREATE TABLE IF NOT EXISTS public.participants
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    first_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    last_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    tc_no character varying(11) COLLATE pg_catalog."default",
    gender character varying(10) COLLATE pg_catalog."default",
    age integer,
    institution_code character varying(50) COLLATE pg_catalog."default",
    institution_name character varying(200) COLLATE pg_catalog."default",
    profession character varying(100) COLLATE pg_catalog."default",
    education character varying(50) COLLATE pg_catalog."default",
    marital_status character varying(50) COLLATE pg_catalog."default",
    created timestamp with time zone DEFAULT now(),
    updated timestamp with time zone DEFAULT now(),
    CONSTRAINT participants_pkey PRIMARY KEY (id),
    CONSTRAINT participants_tc_no_key UNIQUE (tc_no),
    CONSTRAINT participants_age_check CHECK (age >= 0 AND age <= 150),
    CONSTRAINT participants_gender_check CHECK (gender::text = ANY (ARRAY['erkek'::character varying, 'kadin'::character varying, 'other'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.participants
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.participants TO authenticated;

GRANT ALL ON TABLE public.participants TO mmpi_user;
-- Index: idx_participants_created

-- DROP INDEX IF EXISTS public.idx_participants_created;

CREATE INDEX IF NOT EXISTS idx_participants_created
    ON public.participants USING btree
    (created ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_participants_tc_no

-- DROP INDEX IF EXISTS public.idx_participants_tc_no;

CREATE INDEX IF NOT EXISTS idx_participants_tc_no
    ON public.participants USING btree
    (tc_no COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trg_participants_updated

-- DROP TRIGGER IF EXISTS trg_participants_updated ON public.participants;

CREATE OR REPLACE TRIGGER trg_participants_updated
    BEFORE UPDATE 
    ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();