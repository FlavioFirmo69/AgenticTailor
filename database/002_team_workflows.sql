CREATE TABLE IF NOT EXISTS tailor_team (
 id uuid PRIMARY KEY, client_id text NOT NULL, display_name varchar(160) NOT NULL,
 email varchar(254) NOT NULL DEFAULT '', role varchar(120) NOT NULL, active boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1, demo_key text,
 UNIQUE(client_id,id), UNIQUE(client_id,demo_key)
);
CREATE TABLE IF NOT EXISTS tailor_project_models (
 id uuid PRIMARY KEY, client_id text NOT NULL, name varchar(180) NOT NULL, version integer NOT NULL DEFAULT 1,
 description text NOT NULL DEFAULT '', phases jsonb NOT NULL CHECK(jsonb_typeof(phases)='array'), demo_key text,
 UNIQUE(client_id,id), UNIQUE(client_id,demo_key)
);
ALTER TABLE tailor_projects ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE tailor_projects ADD COLUMN IF NOT EXISTS model_id uuid;
ALTER TABLE tailor_projects ADD COLUMN IF NOT EXISTS model_version integer;
ALTER TABLE tailor_projects ADD COLUMN IF NOT EXISTS demo_key text;
CREATE UNIQUE INDEX IF NOT EXISTS tailor_project_demo_key ON tailor_projects(client_id,demo_key);
ALTER TABLE tailor_projects ADD CONSTRAINT tailor_project_owner FOREIGN KEY(client_id,owner_id) REFERENCES tailor_team(client_id,id);
ALTER TABLE tailor_projects ADD CONSTRAINT tailor_project_model FOREIGN KEY(client_id,model_id) REFERENCES tailor_project_models(client_id,id);
CREATE TABLE IF NOT EXISTS tailor_project_phases (
 id uuid PRIMARY KEY, client_id text NOT NULL, project_id uuid NOT NULL, position integer NOT NULL, title text NOT NULL,
 UNIQUE(client_id,id), UNIQUE(client_id,project_id,position),
 FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id)
);
CREATE TABLE IF NOT EXISTS tailor_project_tasks (
 id uuid PRIMARY KEY, client_id text NOT NULL, phase_id uuid NOT NULL, position integer NOT NULL,
 title text NOT NULL, assignee_id uuid, expected_role text NOT NULL DEFAULT '', required boolean NOT NULL DEFAULT true,
 status text NOT NULL DEFAULT 'Da fare' CHECK(status IN ('Da fare','In corso','In attesa','Completato','Non applicabile')),
 due_date date, note text NOT NULL DEFAULT '', version integer NOT NULL DEFAULT 1,
 UNIQUE(client_id,id), UNIQUE(client_id,phase_id,position),
 FOREIGN KEY(client_id,phase_id) REFERENCES tailor_project_phases(client_id,id),
 FOREIGN KEY(client_id,assignee_id) REFERENCES tailor_team(client_id,id)
);
CREATE INDEX IF NOT EXISTS tailor_team_client ON tailor_team(client_id,active);
CREATE INDEX IF NOT EXISTS tailor_tasks_phase ON tailor_project_tasks(client_id,phase_id);
