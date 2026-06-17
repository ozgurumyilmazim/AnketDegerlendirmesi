-- Table: public.page_content

-- DROP TABLE IF EXISTS public.page_content;

CREATE TABLE IF NOT EXISTS public.page_content
(
    id integer NOT NULL DEFAULT nextval('page_content_id_seq'::regclass),
    page_key character varying(50) COLLATE pg_catalog."default" NOT NULL,
    page_title character varying(255) COLLATE pg_catalog."default" NOT NULL DEFAULT ''::character varying,
    page_subtitle text COLLATE pg_catalog."default" DEFAULT ''::text,
    page_body text COLLATE pg_catalog."default" DEFAULT ''::text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT page_content_pkey PRIMARY KEY (id),
    CONSTRAINT page_content_page_key_key UNIQUE (page_key)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.page_content
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.page_content TO authenticated;

GRANT ALL ON TABLE public.page_content TO mmpi_user;