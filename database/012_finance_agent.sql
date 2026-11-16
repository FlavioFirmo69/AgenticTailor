ALTER TABLE tailor_finance_accounts DROP CONSTRAINT tailor_finance_accounts_client_id_check;
CREATE TABLE IF NOT EXISTS tailor_demo_state(client_id text PRIMARY KEY,state jsonb NOT NULL);
INSERT INTO tailor_demo_state(client_id,state) VALUES('personal','{"messages":[],"events":[],"customMarkdown":"","versions":[],"enabledAgents":[]}'::jsonb) ON CONFLICT(client_id) DO NOTHING;
UPDATE tailor_demo_state SET state=jsonb_set(state,'{enabledAgents}',COALESCE(state->'enabledAgents','[]'::jsonb)||'"finance"'::jsonb)
 WHERE client_id='personal' AND NOT(COALESCE(state->'enabledAgents','[]'::jsonb)?'finance');
UPDATE tailor_demo_state SET state=jsonb_set(state,'{enabledAgents}',COALESCE(state->'enabledAgents','[]'::jsonb)-'finance')
 WHERE client_id<>'personal' AND COALESCE(state->'enabledAgents','[]'::jsonb)?'finance';
