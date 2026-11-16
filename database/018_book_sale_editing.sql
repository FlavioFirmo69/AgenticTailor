ALTER TABLE tailor_book_sales ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE tailor_book_sales ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE tailor_book_sale_history (
 id uuid PRIMARY KEY,client_id text NOT NULL,book_id uuid NOT NULL,sale_id uuid NOT NULL,action text NOT NULL,
 snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,book_id) REFERENCES tailor_publications(client_id,id)
);
CREATE INDEX ON tailor_book_sale_history(client_id,book_id,sale_id,created_at DESC);
ALTER TABLE tailor_book_sale_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tailor_book_sale_history FROM PUBLIC;
DO $$ DECLARE r text;BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON tailor_book_sale_history FROM %I',r);END IF;
END LOOP;END $$;
