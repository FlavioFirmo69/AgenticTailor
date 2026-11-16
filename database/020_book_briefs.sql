CREATE TABLE tailor_author_identities (
 client_id text NOT NULL,author_id uuid NOT NULL,markdown text NOT NULL,version integer NOT NULL DEFAULT 1,source_snapshot jsonb,
 PRIMARY KEY(client_id,author_id)
);
CREATE TABLE tailor_book_briefs (
 client_id text NOT NULL,book_id uuid NOT NULL,data jsonb NOT NULL DEFAULT '{}',version integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(client_id,book_id),
 FOREIGN KEY(client_id,book_id) REFERENCES tailor_publications(client_id,id)
);
CREATE TABLE tailor_book_brief_history (
 id uuid PRIMARY KEY,client_id text NOT NULL,book_id uuid NOT NULL,version integer NOT NULL,snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,book_id,version),FOREIGN KEY(client_id,book_id) REFERENCES tailor_publications(client_id,id)
);
DO $$ DECLARE t text; r text;BEGIN
FOREACH t IN ARRAY ARRAY['tailor_author_identities','tailor_book_briefs','tailor_book_brief_history'] LOOP
EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r);END IF;END LOOP;
END LOOP;END $$;
