-- A switch appointment and its workflow task share an identifier across the two tables.
LOCK TABLE tailor_project_tasks IN SHARE ROW EXCLUSIVE MODE;

WITH targets AS (
 SELECT e.id,e.client_id,e.title,e.event_date,phase.id AS phase_id
 FROM tailor_project_events e
 JOIN LATERAL (
  SELECT p.id
  FROM tailor_project_phases p
  WHERE p.client_id=e.client_id AND p.project_id=e.project_id
  ORDER BY EXISTS (
   SELECT 1 FROM tailor_project_tasks t WHERE t.client_id=p.client_id AND t.phase_id=p.id
   AND btrim(t.title) ~* '^fissare (la )?data ((del|dello) )?switch$'
  ) DESC,p.position,p.id
  LIMIT 1
 ) phase ON true
 WHERE e.client_id='personal' AND e.status='planned' AND e.source_snapshot->>'kind'='consulting-switch'
 AND NOT EXISTS (SELECT 1 FROM tailor_project_tasks t WHERE t.id=e.id)
)
INSERT INTO tailor_project_tasks(id,client_id,phase_id,position,title,due_date,required)
SELECT a.id,a.client_id,a.phase_id,
 COALESCE((SELECT MAX(t.position) FROM tailor_project_tasks t WHERE t.client_id=a.client_id AND t.phase_id=a.phase_id),0)
 +row_number() OVER (PARTITION BY a.client_id,a.phase_id ORDER BY a.event_date,a.id),
 a.title,a.event_date,false
FROM targets a
ON CONFLICT (id) DO NOTHING;
