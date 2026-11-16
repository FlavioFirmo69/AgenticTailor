CREATE TABLE tailor_personal_cases (
 id uuid PRIMARY KEY,client_id text NOT NULL CHECK(client_id='personal'),code varchar(80) NOT NULL,title varchar(250) NOT NULL,
 status text NOT NULL CHECK(status IN ('active','in_progress','blocked','completed','closed','cancelled','archived')),
 context_markdown text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 1,
 source_user_id uuid,source_case_id uuid,source_snapshot jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,id),UNIQUE(client_id,code),UNIQUE(client_id,source_user_id,source_case_id)
);
CREATE TABLE tailor_personal_case_tasks (
 id uuid PRIMARY KEY,client_id text NOT NULL,case_id uuid NOT NULL,title varchar(500) NOT NULL,description text NOT NULL DEFAULT '',
 status text NOT NULL CHECK(status IN ('open','planned','in_progress','blocked','to_verify','completed','cancelled')),
 priority integer NOT NULL DEFAULT 3 CHECK(priority BETWEEN 0 AND 255),due_date date,due_time time,completed_at timestamptz,
 version integer NOT NULL DEFAULT 1,source_task_id uuid,source_snapshot jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,id),UNIQUE(client_id,source_task_id),
 FOREIGN KEY(client_id,case_id) REFERENCES tailor_personal_cases(client_id,id)
);
CREATE TABLE tailor_personal_case_events (
 id uuid PRIMARY KEY,client_id text NOT NULL,case_id uuid NOT NULL,title varchar(500) NOT NULL,event_date date NOT NULL,
 start_time time,end_time time,location text NOT NULL DEFAULT '',status text NOT NULL CHECK(status IN ('planned','completed','cancelled')),
 version integer NOT NULL DEFAULT 1,source_event_id uuid,source_snapshot jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,id),UNIQUE(client_id,source_event_id),
 FOREIGN KEY(client_id,case_id) REFERENCES tailor_personal_cases(client_id,id)
);
CREATE TABLE tailor_personal_case_history (
 id uuid PRIMARY KEY,client_id text NOT NULL,case_id uuid NOT NULL,kind text NOT NULL,title text NOT NULL,
 text text NOT NULL DEFAULT '',snapshot jsonb,source_table text,source_id text,occurred_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,source_table,source_id),FOREIGN KEY(client_id,case_id) REFERENCES tailor_personal_cases(client_id,id)
);
CREATE INDEX tailor_personal_tasks_case ON tailor_personal_case_tasks(client_id,case_id,status);
CREATE INDEX tailor_personal_events_date ON tailor_personal_case_events(client_id,event_date);
CREATE INDEX tailor_personal_history_case ON tailor_personal_case_history(client_id,case_id,occurred_at);
ALTER TABLE tailor_personal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailor_personal_case_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailor_personal_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailor_personal_case_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tailor_personal_cases,tailor_personal_case_tasks,tailor_personal_case_events,tailor_personal_case_history FROM PUBLIC;
DO $protect$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON tailor_personal_cases,tailor_personal_case_tasks,tailor_personal_case_events,tailor_personal_case_history FROM anon; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON tailor_personal_cases,tailor_personal_case_tasks,tailor_personal_case_events,tailor_personal_case_history FROM authenticated; END IF;
END $protect$;
