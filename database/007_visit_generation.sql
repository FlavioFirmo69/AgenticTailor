CREATE TABLE tailor_visit_instructions (
 client_id text PRIMARY KEY,markdown text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tailor_visit_simulations (
 client_id text NOT NULL,visit_id uuid NOT NULL,language text NOT NULL CHECK(language IN ('it','es')),
 source_hash text NOT NULL,base_hash text NOT NULL,output text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(client_id,visit_id,language),FOREIGN KEY(client_id,visit_id) REFERENCES tailor_site_visits(client_id,id)
);
CREATE TABLE tailor_visit_generations (
 id uuid PRIMARY KEY,client_id text NOT NULL,visit_id uuid NOT NULL,source_hash text NOT NULL,
 base_markdown text NOT NULL,custom_markdown text NOT NULL,instruction_version integer NOT NULL,
 language text NOT NULL,output text NOT NULL,mode text NOT NULL DEFAULT 'simulated-chat',created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,visit_id) REFERENCES tailor_site_visits(client_id,id)
);
ALTER TABLE tailor_site_visits ADD COLUMN report_generation jsonb;
