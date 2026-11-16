CREATE TABLE tailor_workspace_identities (
 client_id text NOT NULL,identity_key text NOT NULL,member_id uuid NOT NULL,
 PRIMARY KEY(client_id,identity_key),FOREIGN KEY(client_id,member_id) REFERENCES tailor_team(client_id,id)
);
INSERT INTO tailor_workspace_identities(client_id,identity_key,member_id)
SELECT client_id,'local-consultant',id FROM tailor_team WHERE client_id='personal' AND demo_key='personal-owner'
ON CONFLICT DO NOTHING;
ALTER TABLE tailor_workspace_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tailor_workspace_identities FROM PUBLIC;
DO $$ DECLARE r text; BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON tailor_workspace_identities FROM %I',r);END IF;
END LOOP;END $$;
