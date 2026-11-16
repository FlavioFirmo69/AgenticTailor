ALTER TABLE tailor_project_models ADD COLUMN IF NOT EXISTS hours_per_day numeric(5,2) NOT NULL DEFAULT 8 CHECK(hours_per_day>0 AND hours_per_day<=24);
CREATE TABLE IF NOT EXISTS tailor_project_model_versions (
 client_id text NOT NULL, model_id uuid NOT NULL, version integer NOT NULL,
 snapshot jsonb NOT NULL, actor text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(client_id,model_id,version),
 FOREIGN KEY(client_id,model_id) REFERENCES tailor_project_models(client_id,id)
);
ALTER TABLE tailor_project_tasks ADD COLUMN IF NOT EXISTS estimate_type text CHECK(estimate_type IN ('fixed','percent'));
ALTER TABLE tailor_project_tasks ADD COLUMN IF NOT EXISTS estimate_value numeric(10,2) CHECK(estimate_value>=0);
