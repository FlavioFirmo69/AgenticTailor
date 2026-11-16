ALTER TABLE tailor_project_phases ADD CONSTRAINT tailor_phase_project_id UNIQUE(client_id,project_id,id);
ALTER TABLE tailor_site_visits ADD COLUMN phase_id uuid;
ALTER TABLE tailor_site_visits ADD CONSTRAINT tailor_visit_phase FOREIGN KEY(client_id,project_id,phase_id) REFERENCES tailor_project_phases(client_id,project_id,id);
CREATE TABLE tailor_project_documents (
 id uuid PRIMARY KEY,client_id text NOT NULL,project_id uuid NOT NULL,title varchar(180) NOT NULL,
 kind text NOT NULL CHECK(kind IN ('Documento','Disegno','Relazione','Altro')),task_id uuid,visit_id uuid,demo_key text,
 UNIQUE(client_id,id),UNIQUE(client_id,project_id,id),UNIQUE(client_id,demo_key),
 FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id),
 FOREIGN KEY(client_id,task_id) REFERENCES tailor_project_tasks(client_id,id),
 FOREIGN KEY(client_id,project_id,visit_id) REFERENCES tailor_site_visits(client_id,project_id,id)
);
CREATE TABLE tailor_document_phases (
 client_id text NOT NULL,project_id uuid NOT NULL,document_id uuid NOT NULL,phase_id uuid NOT NULL,
 PRIMARY KEY(client_id,document_id,phase_id),
 FOREIGN KEY(client_id,project_id,document_id) REFERENCES tailor_project_documents(client_id,project_id,id) ON DELETE CASCADE,
 FOREIGN KEY(client_id,project_id,phase_id) REFERENCES tailor_project_phases(client_id,project_id,id)
);
CREATE TABLE tailor_document_revisions (
 id uuid PRIMARY KEY,client_id text NOT NULL,document_id uuid NOT NULL,revision integer NOT NULL CHECK(revision>0),
 status text NOT NULL CHECK(status IN ('Bozza','Da verificare','Approvato','Consegnato')),
 document_date date NOT NULL,filename text NOT NULL,mime text NOT NULL,bytes bytea NOT NULL,note text NOT NULL DEFAULT '',
 actor text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(client_id,document_id,revision),
 FOREIGN KEY(client_id,document_id) REFERENCES tailor_project_documents(client_id,id) ON DELETE CASCADE
);
CREATE INDEX tailor_documents_project ON tailor_project_documents(client_id,project_id);
