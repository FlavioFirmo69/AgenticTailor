CREATE TABLE tailor_finance_accounts (
 id uuid PRIMARY KEY,client_id text NOT NULL CHECK(client_id='personal'),code text NOT NULL,display_name text NOT NULL,
 account_type text NOT NULL,currency text NOT NULL,include_in_projection boolean NOT NULL,is_active boolean NOT NULL,
 version integer NOT NULL DEFAULT 1,source_user_id uuid,source_snapshot jsonb,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(client_id,id),UNIQUE(client_id,code)
);
CREATE TABLE tailor_finance_balances (
 id uuid PRIMARY KEY,client_id text NOT NULL,account_id uuid NOT NULL,balance_date date NOT NULL,balance numeric(18,2) NOT NULL,
 previous_balance numeric(18,2),reconciliation_amount numeric(18,2),notes text NOT NULL DEFAULT '',source_snapshot jsonb,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,account_id) REFERENCES tailor_finance_accounts(client_id,id)
);
CREATE TABLE tailor_finance_transactions (
 id uuid PRIMARY KEY,client_id text NOT NULL,account_id uuid NOT NULL,transaction_date date NOT NULL,description text NOT NULL,
 amount numeric(18,2) NOT NULL,status text NOT NULL CHECK(status IN ('planned','confirmed','cancelled')),is_recurring boolean NOT NULL DEFAULT false,
 confirmed_at timestamptz,source_snapshot jsonb,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,account_id) REFERENCES tailor_finance_accounts(client_id,id)
);
CREATE TABLE tailor_finance_history (
 id uuid PRIMARY KEY,client_id text NOT NULL,account_id uuid NOT NULL,action text NOT NULL,snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(client_id,account_id) REFERENCES tailor_finance_accounts(client_id,id)
);
CREATE INDEX ON tailor_finance_balances(client_id,account_id,balance_date DESC,created_at DESC);
CREATE INDEX ON tailor_finance_transactions(client_id,account_id,status,transaction_date);
DO $$ DECLARE t text; r text; BEGIN
 FOREACH t IN ARRAY ARRAY['tailor_finance_accounts','tailor_finance_balances','tailor_finance_transactions','tailor_finance_history'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r); END IF;
 END LOOP; END LOOP;
END $$;
