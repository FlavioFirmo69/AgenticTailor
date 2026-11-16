CREATE TABLE tailor_book_stock (
 id uuid PRIMARY KEY,client_id text NOT NULL,book_id uuid NOT NULL,purchase_date date NOT NULL,quantity integer NOT NULL CHECK(quantity>0),
 notes text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),source_snapshot jsonb,
 FOREIGN KEY(client_id,book_id) REFERENCES tailor_publications(client_id,id)
);
CREATE TABLE tailor_book_stock_imports(client_id text PRIMARY KEY,manifest jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE tailor_book_stock_history(id uuid PRIMARY KEY,client_id text NOT NULL,book_id uuid NOT NULL,stock_id uuid NOT NULL,snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(client_id,book_id) REFERENCES tailor_publications(client_id,id));
CREATE INDEX ON tailor_book_stock(client_id,book_id,purchase_date);
DO $$ DECLARE t text; r text; BEGIN
FOREACH t IN ARRAY ARRAY['tailor_book_stock','tailor_book_stock_imports','tailor_book_stock_history'] LOOP
EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r);END IF;END LOOP;
END LOOP;END $$;
