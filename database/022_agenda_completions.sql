CREATE TABLE tailor_agenda_completions (
 client_id text NOT NULL,event_key text NOT NULL,completed_at timestamptz,version integer NOT NULL DEFAULT 1,
 snapshot jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(client_id,event_key)
);
CREATE TABLE tailor_agenda_completion_history (
 id uuid PRIMARY KEY,client_id text NOT NULL,event_key text NOT NULL,action text NOT NULL,actor text NOT NULL,
 snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,event_key) REFERENCES tailor_agenda_completions(client_id,event_key)
);
DO $$ DECLARE t text;r text;BEGIN
FOREACH t IN ARRAY ARRAY['tailor_agenda_completions','tailor_agenda_completion_history'] LOOP
EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r);END IF;END LOOP;
END LOOP;END $$;
