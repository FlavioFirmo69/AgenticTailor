CREATE TABLE tailor_marketing_strategies (
 id uuid PRIMARY KEY, client_id text NOT NULL, subject_kind text NOT NULL, subject_id uuid NOT NULL,
 title text NOT NULL, active_revision integer, version integer NOT NULL DEFAULT 1,
 UNIQUE(client_id,id), UNIQUE(client_id,subject_kind,subject_id)
);
CREATE TABLE tailor_marketing_revisions (
 client_id text NOT NULL, strategy_id uuid NOT NULL, revision integer NOT NULL,
 state text NOT NULL CHECK(state IN ('draft','approved','rejected','superseded')),
 reason text NOT NULL, effective_on date NOT NULL, plan jsonb NOT NULL, style_markdown text NOT NULL,
 identity_version integer, brief_version integer NOT NULL, origin text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz, decided_by text,
 PRIMARY KEY(client_id,strategy_id,revision),
 FOREIGN KEY(client_id,strategy_id) REFERENCES tailor_marketing_strategies(client_id,id)
);
CREATE TABLE tailor_marketing_activities (
 id uuid PRIMARY KEY, client_id text NOT NULL, strategy_id uuid NOT NULL, revision integer NOT NULL,
 item_key text NOT NULL, scheduled_on date NOT NULL, channel text NOT NULL, title text NOT NULL, body text NOT NULL,
 state text NOT NULL CHECK(state IN ('todo','ready','published','cancelled')) DEFAULT 'todo',
 cancellation_reason text, version integer NOT NULL DEFAULT 1,
 UNIQUE(client_id,id), UNIQUE(client_id,strategy_id,revision,item_key),
 FOREIGN KEY(client_id,strategy_id,revision) REFERENCES tailor_marketing_revisions(client_id,strategy_id,revision)
);
CREATE TABLE tailor_marketing_audit (
 id uuid PRIMARY KEY,client_id text NOT NULL,strategy_id uuid NOT NULL,action text NOT NULL,payload jsonb NOT NULL,
 actor text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,strategy_id) REFERENCES tailor_marketing_strategies(client_id,id)
);
CREATE INDEX ON tailor_marketing_activities(client_id,scheduled_on) WHERE state NOT IN ('cancelled','published');
DO $$ DECLARE t text;r text;BEGIN
FOREACH t IN ARRAY ARRAY['tailor_marketing_strategies','tailor_marketing_revisions','tailor_marketing_activities','tailor_marketing_audit'] LOOP
EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r);END IF;END LOOP;
END LOOP;END $$;
