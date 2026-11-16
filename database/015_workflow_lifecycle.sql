CREATE TABLE tailor_workflow_archives (
 id uuid PRIMARY KEY,client_id text NOT NULL,project_id uuid NOT NULL,payload jsonb NOT NULL,
 actor text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),restored_at timestamptz,
 FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id)
);
CREATE INDEX ON tailor_workflow_archives(client_id,project_id,created_at DESC);
ALTER TABLE tailor_workflow_archives ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tailor_workflow_archives FROM PUBLIC;
DO $$ DECLARE r text; k record; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON tailor_workflow_archives FROM %I',r); END IF;
 END LOOP;
 -- Un trasferimento aggiorna i legami compositi nella stessa transazione.
 FOR k IN SELECT conname,conrelid::regclass AS tbl FROM pg_constraint
 WHERE contype='f' AND conrelid IN ('tailor_site_visits'::regclass,'tailor_visit_photos'::regclass,'tailor_project_documents'::regclass,'tailor_document_phases'::regclass)
 LOOP EXECUTE format('ALTER TABLE %s ALTER CONSTRAINT %I DEFERRABLE INITIALLY IMMEDIATE',k.tbl,k.conname); END LOOP;
END $$;
