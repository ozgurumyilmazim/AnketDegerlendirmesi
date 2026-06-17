-- Table: public.reports

-- DROP TABLE IF EXISTS public.reports;

CREATE TABLE IF NOT EXISTS public.reports
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    test_result_id uuid,
    report_content jsonb NOT NULL,
    report_type character varying(50) COLLATE pg_catalog."default" DEFAULT 'standard'::character varying,
    generated_by character varying(100) COLLATE pg_catalog."default",
    created timestamp with time zone DEFAULT now(),
    updated timestamp with time zone DEFAULT now(),
    psychologist_name text COLLATE pg_catalog."default",
    evaluation_date date,
    participation text COLLATE pg_catalog."default",
    validity text COLLATE pg_catalog."default",
    additional_evaluation_note text COLLATE pg_catalog."default",
    pdp_results jsonb,
    task_definitions_evaluation jsonb,
    evaluation_process text COLLATE pg_catalog."default",
    measurement_process text COLLATE pg_catalog."default",
    competency_evaluation jsonb,
    session_need_status text COLLATE pg_catalog."default",
    session_explanation text COLLATE pg_catalog."default",
    data_usage_recommendations text COLLATE pg_catalog."default",
    CONSTRAINT reports_pkey PRIMARY KEY (id),
    CONSTRAINT mmpi_reports_test_result_id_fkey FOREIGN KEY (test_result_id)
        REFERENCES public.test_results (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.reports
    OWNER to admin_user;

GRANT ALL ON TABLE public.reports TO admin_user;

GRANT ALL ON TABLE public.reports TO authenticated;

-- Trigger: update_reports_updated

-- DROP TRIGGER IF EXISTS update_reports_updated ON public.reports;

CREATE OR REPLACE TRIGGER update_reports_updated
    BEFORE UPDATE 
    ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_column();