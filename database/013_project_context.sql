CREATE TABLE tailor_project_context (
 id uuid PRIMARY KEY,client_id text NOT NULL,project_id uuid NOT NULL,source_case_id uuid NOT NULL,
 context_markdown text NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,source_case_id),FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id)
);
CREATE TABLE tailor_project_events (
 id uuid PRIMARY KEY,client_id text NOT NULL,project_id uuid NOT NULL,title text NOT NULL,event_date date NOT NULL,
 start_time time,end_time time,location text NOT NULL,status text NOT NULL CHECK(status IN ('planned','completed','cancelled')),
 version integer NOT NULL DEFAULT 1,source_snapshot jsonb,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id)
);
ALTER TABLE tailor_personal_cases ADD COLUMN converted_project_id uuid;
ALTER TABLE tailor_personal_cases ADD CONSTRAINT converted_project_scope FOREIGN KEY(client_id,converted_project_id) REFERENCES tailor_projects(client_id,id);
CREATE INDEX ON tailor_project_context(client_id,project_id);
CREATE INDEX ON tailor_project_events(client_id,project_id,event_date);
DO $$ DECLARE t text; r text; BEGIN
 FOREACH t IN ARRAY ARRAY['tailor_project_context','tailor_project_events'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r); END IF;
 END LOOP; END LOOP;
END $$;
