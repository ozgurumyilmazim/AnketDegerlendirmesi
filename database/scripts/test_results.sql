-- Table: public.test_results

-- DROP TABLE IF EXISTS public.test_results;

CREATE TABLE IF NOT EXISTS public.test_results
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    participant_id uuid,
    test_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    dont_know_count integer DEFAULT 0,
    completed_questions integer DEFAULT 0,
    total_questions integer DEFAULT 567,
    test_type character varying(50) COLLATE pg_catalog."default" DEFAULT 'MMPI-2'::character varying,
    test_version character varying(20) COLLATE pg_catalog."default" DEFAULT '1.0'::character varying,
    status character varying(20) COLLATE pg_catalog."default" DEFAULT 'completed'::character varying,
    created timestamp with time zone DEFAULT now(),
    updated timestamp with time zone DEFAULT now(),
    CONSTRAINT test_results_pkey PRIMARY KEY (id),
    CONSTRAINT test_results_participant_id_fkey FOREIGN KEY (participant_id)
        REFERENCES public.participants (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL,
    CONSTRAINT test_results_status_check CHECK (status::text = ANY (ARRAY['started'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'abandoned'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.test_results
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.test_results TO authenticated;

GRANT ALL ON TABLE public.test_results TO mmpi_user;
-- Index: idx_test_results_created

-- DROP INDEX IF EXISTS public.idx_test_results_created;

CREATE INDEX IF NOT EXISTS idx_test_results_created
    ON public.test_results USING btree
    (created ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_test_results_participant

-- DROP INDEX IF EXISTS public.idx_test_results_participant;

CREATE INDEX IF NOT EXISTS idx_test_results_participant
    ON public.test_results USING btree
    (participant_id ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_test_results_status

-- DROP INDEX IF EXISTS public.idx_test_results_status;

CREATE INDEX IF NOT EXISTS idx_test_results_status
    ON public.test_results USING btree
    (status COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Trigger: trg_test_results_updated

-- DROP TRIGGER IF EXISTS trg_test_results_updated ON public.test_results;

CREATE OR REPLACE TRIGGER trg_test_results_updated
    BEFORE UPDATE 
    ON public.test_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();