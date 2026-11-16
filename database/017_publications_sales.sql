CREATE TABLE tailor_publications (
 id uuid PRIMARY KEY,client_id text NOT NULL,code text NOT NULL,title text NOT NULL,author_id uuid NOT NULL,author_name text NOT NULL,
 status text NOT NULL,publication_date date,date_precision text NOT NULL,genre text NOT NULL DEFAULT '',synopsis text NOT NULL DEFAULT '',format_notes text NOT NULL DEFAULT '',
 source_user_id uuid,source_snapshot jsonb,UNIQUE(client_id,id),UNIQUE(client_id,code)
);
CREATE TABLE tailor_publication_editions (
 id uuid PRIMARY KEY,client_id text NOT NULL,book_id uuid NOT NULL,format_code text NOT NULL,status text NOT NULL,
 publication_date date,isbn text NOT NULL DEFAULT '',notes text NOT NULL DEFAULT '',source_snapshot jsonb,
 UNIQUE(client_id,book_id,id),FOREIGN KEY(client_id,book_id) REFERENCES tailor_publications(client_id,id)
);
CREATE TABLE tailor_book_sales (
 id uuid PRIMARY KEY,client_id text NOT NULL,book_id uuid NOT NULL,edition_id uuid,sale_date date NOT NULL,quantity integer NOT NULL,
 channel text NOT NULL,notes text NOT NULL DEFAULT '',source_system text,external_id text,imported_at timestamptz,from_inventory boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),source_snapshot jsonb,
 FOREIGN KEY(client_id,book_id) REFERENCES tailor_publications(client_id,id),
 FOREIGN KEY(client_id,book_id,edition_id) REFERENCES tailor_publication_editions(client_id,book_id,id)
);
CREATE TABLE tailor_book_imports (
 client_id text PRIMARY KEY,source_user_id uuid NOT NULL,manifest jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON tailor_book_sales(client_id,book_id,sale_date DESC);
DO $$ DECLARE t text; r text; BEGIN
 FOREACH t IN ARRAY ARRAY['tailor_publications','tailor_publication_editions','tailor_book_sales','tailor_book_imports'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r); END IF;
 END LOOP;END LOOP;
END $$;
