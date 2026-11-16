CREATE TABLE tailor_site_visits (
 id uuid PRIMARY KEY, client_id text NOT NULL, project_id uuid NOT NULL,
 title text NOT NULL, visit_date date NOT NULL, place text NOT NULL DEFAULT '', participants text NOT NULL DEFAULT '',
 purpose text NOT NULL DEFAULT '', observations text NOT NULL DEFAULT '', decisions text NOT NULL DEFAULT '', actions text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'Pianificato' CHECK(status IN ('Pianificato','Svolto','Verbale in bozza','Confermato','Annullato')),
 report text NOT NULL DEFAULT '', version integer NOT NULL DEFAULT 1, demo_key text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,id), UNIQUE(client_id,project_id,id), UNIQUE(client_id,demo_key),
 FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id)
);
CREATE TABLE tailor_visit_photos (
 id uuid PRIMARY KEY, client_id text NOT NULL, project_id uuid NOT NULL, visit_id uuid NOT NULL,
 caption text NOT NULL DEFAULT '', mime text NOT NULL, bytes bytea NOT NULL, generated boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,project_id,visit_id) REFERENCES tailor_site_visits(client_id,project_id,id) ON DELETE CASCADE
);
CREATE TABLE tailor_visit_reports (
 id uuid PRIMARY KEY, client_id text NOT NULL, visit_id uuid NOT NULL, revision integer NOT NULL,
 snapshot jsonb NOT NULL, actor text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,visit_id,revision), FOREIGN KEY(client_id,visit_id) REFERENCES tailor_site_visits(client_id,id)
);
