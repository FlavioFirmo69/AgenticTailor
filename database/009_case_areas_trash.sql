ALTER TABLE tailor_personal_cases ADD COLUMN area text NOT NULL DEFAULT 'personal' CHECK(area IN ('personal','consulting'));
ALTER TABLE tailor_personal_cases ADD COLUMN deleted_at timestamptz;
WITH moved AS (
 UPDATE tailor_personal_cases SET area='consulting',version=version+1,updated_at=now()
 WHERE client_id='personal' AND code IN ('FRUIT','SIGMA') AND area='personal' RETURNING id
)
INSERT INTO tailor_personal_case_history(id,client_id,case_id,kind,title,text,snapshot)
SELECT gen_random_uuid(),'personal',id,'change','Spostamento in Consulenza e sviluppi','Attività, appuntamenti e storico conservati.', '{"area":"consulting"}'::jsonb FROM moved;
