import env from '@next/env';
import pg from 'pg';
import {readFile} from 'node:fs/promises';
env.loadEnvConfig(process.cwd());
const client='engineering';
const members=[
 ['lead','Socio referente (demo)','Socio referente'],
 ['reviewer','Socio revisore (demo)','Socio revisore'],
 ['mechanical','Progettista meccanico (demo)','Progettista meccanico'],
 ['electrical','Progettista elettrico (demo)','Progettista elettrico'],
 ['admin','Amministrativa (demo)','Amministrativa'],
];
const phaseData=[
 ['Richiesta del cliente',[['Registrare richiesta e riferimenti','Amministrativa'],['Valutare perimetro e prossimi passi','Socio referente']]],
 ['Apertura della scheda',[['Aprire scheda e archivio della commessa','Amministrativa'],['Confermare responsabile e dati iniziali','Socio referente']]],
 ['Preventivo professionale',[['Preparare proposta e prestazioni previste','Socio referente'],['Registrare versione ed esito dell’offerta','Amministrativa']]],
 ['Accettazione e assegnazione',[['Confermare accettazione e assegnazioni','Socio referente'],['Registrare briefing e decisioni','Progettista meccanico']]],
 ['Raccolta dei documenti',[['Verificare checklist e documenti ricevuti','Progettista meccanico'],['Richiedere e registrare integrazioni','Progettista elettrico']]],
 ['Disegno e dimensionamento',[['Preparare disegni e dati dell’impianto meccanico','Progettista meccanico'],['Preparare disegni e dati dell’impianto elettrico','Progettista elettrico'],['Verificare dimensionamenti e revisione delle tavole','Socio revisore']]],
 ['Computo',[['Preparare quantità e mappature del computo','Progettista meccanico'],['Verificare quantità, codici e voci non mappate','Socio revisore']]],
 ['Relazioni capitolati e moduli',[['Preparare documenti dai dati confermati','Progettista elettrico'],['Revisionare relazioni e capitolati','Socio revisore']]],
 ['Sopralluoghi e direzione lavori',[['Preparare e svolgere il sopralluogo','Progettista meccanico'],['Confermare verbale, decisioni e azioni','Socio referente']]],
 ['Controllo consegne e chiusura',[['Approvare tecnicamente la revisione da consegnare','Socio revisore'],['Registrare pacchetto e consegna','Amministrativa'],['Confermare chiusura e assistenza successiva','Socio referente']]],
];
const phases=phaseData.map(([title,tasks])=>({title,tasks:tasks.map(([title,role])=>({title,role,required:true}))}));
const c=new pg.Client({connectionString:process.env.DATABASE_URL});
try{await c.connect();await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(73421801)');await c.query('CREATE TABLE IF NOT EXISTS tailor_schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
 for(const version of ['001_projects','002_team_workflows','003_model_estimates']){if(!(await c.query('SELECT version FROM tailor_schema_migrations WHERE version=$1',[version])).rowCount){await c.query(await readFile(new URL('../database/'+version+'.sql',import.meta.url),'utf8'));await c.query('INSERT INTO tailor_schema_migrations(version) VALUES($1)',[version]);}}
 const ids={};for(const [key,name,role] of members){await c.query('INSERT INTO tailor_team(id,client_id,display_name,email,role,demo_key) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(client_id,demo_key) DO NOTHING',[crypto.randomUUID(),client,name,'',role,'sigma-demo-'+key]);const r=await c.query('SELECT id FROM tailor_team WHERE client_id=$1 AND demo_key=$2',[client,'sigma-demo-'+key]);ids[role]=r.rows[0].id;}
 await c.query('INSERT INTO tailor_project_models(id,client_id,name,description,phases,demo_key) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(client_id,demo_key) DO NOTHING',[crypto.randomUUID(),client,'Studio tecnico · 10 fasi','Modello dimostrativo ricavato dai dieci passi della relazione Sigma. Task iniziali da concordare e adattare con lo studio; nessuna approvazione tecnica implicita.',JSON.stringify(phases),'sigma-ten-phases']);
 const model=(await c.query('SELECT * FROM tailor_project_models WHERE client_id=$1 AND demo_key=$2',[client,'sigma-ten-phases'])).rows[0];
 for(const [key,code,title,ownerRole] of [['ballroom','DEMO-BWH','Ballroom White House','Progettista meccanico'],['hotel','DEMO-HLX','Hotel Luxury','Progettista elettrico']]){
  if((await c.query('SELECT id FROM tailor_projects WHERE client_id=$1 AND demo_key=$2',[client,'sigma-demo-'+key])).rowCount)continue;
  const id=crypto.randomUUID();await c.query('INSERT INTO tailor_projects(id,client_id,code,title,customer,owner,owner_id,status,description,model_id,model_version,demo_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[id,client,code,title,'Committente dimostrativo',members.find(m=>m[2]===ownerRole)[1],ids[ownerRole],'Attiva','Commessa dimostrativa. Persone, assegnazioni e attività sono esempi da confermare con lo studio. Nessun lavoro reale o approvazione è dichiarato.',model.id,model.version,'sigma-demo-'+key]);
  let position=0;for(const p of model.phases){const phaseId=crypto.randomUUID();await c.query('INSERT INTO tailor_project_phases(id,client_id,project_id,position,title) VALUES($1,$2,$3,$4,$5)',[phaseId,client,id,++position,p.title]);let order=0;for(const t of p.tasks)await c.query('INSERT INTO tailor_project_tasks(id,client_id,phase_id,position,title,assignee_id,expected_role,required,estimate_type,estimate_value) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[crypto.randomUUID(),client,phaseId,++order,t.title,ids[t.role],t.role,t.required,t.estimate?.type??null,t.estimate?.value??null]);}
  await c.query("INSERT INTO tailor_project_diary(id,client_id,project_id,kind,text,actor,occurred_on) VALUES($1,$2,$3,'created',$4,$5,(now() AT TIME ZONE 'Europe/Rome')::date)",[crypto.randomUUID(),client,id,'Creata commessa dimostrativa con copia indipendente del modello Studio tecnico · 10 fasi. Tutti i task sono da fare e assegnati a persone demo.','Consulente · dati demo']);
 }
 await c.query('CREATE TABLE IF NOT EXISTS tailor_demo_state(client_id text PRIMARY KEY,state jsonb NOT NULL)');await c.query('INSERT INTO tailor_demo_state VALUES($1,$2) ON CONFLICT DO NOTHING',[client,{messages:[],events:[],customMarkdown:'',versions:[],enabledAgents:[]}]);const state=(await c.query('SELECT state FROM tailor_demo_state WHERE client_id=$1 FOR UPDATE',[client])).rows[0].state;state.enabledAgents=Array.from(new Set([...(state.enabledAgents??[]),'projects']));await c.query('UPDATE tailor_demo_state SET state=$2 WHERE client_id=$1',[client,state]);
 await c.query('COMMIT');console.log('Studio tecnico preparato: 5 persone demo, modello di 10 fasi e 22 task, 2 commesse indipendenti. Commesse attivato solo nello Studio tecnico. Dati esistenti preservati.');
}catch(e){await c.query('ROLLBACK').catch(()=>{});console.error('Preparazione non riuscita: '+(e.code??e.message));process.exitCode=1;}finally{await c.end();}
