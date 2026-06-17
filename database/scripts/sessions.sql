-- Table: public.sessions

-- DROP TABLE IF EXISTS public.sessions;

CREATE TABLE IF NOT EXISTS public.sessions
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    token character varying(512) COLLATE pg_catalog."default" NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_token_key UNIQUE (token),
    CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.sessions
    OWNER to mmpi_user;

GRANT ALL ON TABLE public.sessions TO authenticated;

GRANT ALL ON TABLE public.sessions TO mmpi_user;
-- Index: idx_sessions_token

-- DROP INDEX IF EXISTS public.idx_sessions_token;

CREATE INDEX IF NOT EXISTS idx_sessions_token
    ON public.sessions USING btree
    (token COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_sessions_user

-- DROP INDEX IF EXISTS public.idx_sessions_user;

CREATE INDEX IF NOT EXISTS idx_sessions_user
    ON public.sessions USING btree
    (user_id ASC NULLS LAST)
    TABLESPACE pg_default;