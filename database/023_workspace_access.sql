CREATE TABLE tailor_workspace_access(email text PRIMARY KEY CHECK(email=lower(email)),client_id text NOT NULL CHECK(client_id IN ('engineering','dentist','writer')),active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE tailor_workspace_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tailor_workspace_access FROM PUBLIC,anon,authenticated;
