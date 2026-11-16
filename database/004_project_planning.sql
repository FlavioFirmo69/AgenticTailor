ALTER TABLE tailor_projects ADD COLUMN IF NOT EXISTS estimated_days numeric(10,2);
ALTER TABLE tailor_projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE tailor_project_tasks ADD COLUMN IF NOT EXISTS planned_start date;
ALTER TABLE tailor_project_tasks ADD COLUMN IF NOT EXISTS planned_end date;
ALTER TABLE tailor_project_tasks ADD COLUMN IF NOT EXISTS estimated_minutes integer;
CREATE TABLE IF NOT EXISTS tailor_project_plans (
 id uuid PRIMARY KEY, client_id text NOT NULL, project_id uuid NOT NULL, revision integer NOT NULL,
 snapshot jsonb NOT NULL, actor text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,project_id,revision),
 FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id)
);
