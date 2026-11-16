CREATE TABLE IF NOT EXISTS tailor_projects (
 id uuid PRIMARY KEY,
 client_id text NOT NULL,
 code varchar(32) NOT NULL,
 title varchar(180) NOT NULL,
 customer varchar(180) NOT NULL DEFAULT '',
 owner varchar(120) NOT NULL DEFAULT '',
 status text NOT NULL CHECK(status IN ('Da valutare','Offerta','Attiva','In attesa','Completata','Non acquisita','Annullata')),
 due_date date,
 description text NOT NULL DEFAULT '',
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,code),
 UNIQUE(client_id,id)
);
CREATE INDEX IF NOT EXISTS tailor_projects_client_status ON tailor_projects(client_id,status);
CREATE TABLE IF NOT EXISTS tailor_project_diary (
 id uuid PRIMARY KEY,
 client_id text NOT NULL,
 project_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('created','updated','note')),
 text text NOT NULL,
 actor text NOT NULL,
 occurred_on date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,project_id) REFERENCES tailor_projects(client_id,id)
);
CREATE INDEX IF NOT EXISTS tailor_project_diary_project ON tailor_project_diary(client_id,project_id,occurred_on,created_at);
