import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pool} from './store';
import {Project,DiaryEntry,validateProject,validateDiary,type ProjectProgress} from './projects-domain';
const runtime=globalThis as unknown as {tailorProjectsSchemaV25?:Promise<void>};
export async function ready(){
 if(!process.env.DATABASE_URL)throw Error('Il modulo Commesse richiede PostgreSQL. Configurare DATABASE_URL.');
 if(!runtime.tailorProjectsSchemaV25){runtime.tailorProjectsSchemaV25=(async()=>{const c=await pool().connect();try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(73421801)');await c.query('CREATE TABLE IF NOT EXISTS tailor_schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');for(const version of ['001_projects','002_team_workflows','003_model_estimates','004_project_planning','005_site_visits','006_project_timeline','007_visit_generation','008_personal_cases','009_case_areas_trash','010_personal_finance','011_finance_details','012_finance_agent','013_project_context','014_project_value_phase_status','015_workflow_lifecycle','016_agenda_identity','017_publications_sales','018_book_sale_editing','019_book_stock','020_book_briefs','021_marketing_lifecycle','022_agenda_completions','023_workspace_access','024_finance_recurrences','025_consulting_switch_tasks']){const exists=await c.query('SELECT version FROM tailor_schema_migrations WHERE version=$1',[version]);if(!exists.rowCount){await c.query(await readFile(path.join(process.cwd(),'database/'+version+'.sql'),'utf8'));await c.query('INSERT INTO tailor_schema_migrations(version) VALUES($1)',[version]);}}await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}})().catch(e=>{runtime.tailorProjectsSchemaV25=undefined;throw e;});}
 await runtime.tailorProjectsSchemaV25;
}
function project(row:Record<string,unknown>):Project{return {expectedValue:row.expected_value==null?null:String(row.expected_value),id:String(row.id),code:String(row.code),title:String(row.title),customer:String(row.customer),owner:String(row.owner_name??row.owner),ownerId:row.owner_id?String(row.owner_id):null,status:row.status as Project['status'],dueDate:row.due_date?String(row.due_date).slice(0,10):null,description:String(row.description),version:Number(row.version),createdAt:new Date(row.created_at as string).toISOString(),updatedAt:new Date(row.updated_at as string).toISOString()};}
const columns='expected_value,id,code,title,customer,owner,owner_id,(SELECT display_name FROM tailor_team WHERE id=tailor_projects.owner_id AND client_id=tailor_projects.client_id) AS owner_name,status,to_char(due_date,\'YYYY-MM-DD\') AS due_date,description,version,created_at,updated_at';
export async function listProjectProgress(client:string):Promise<ProjectProgress[]>{
 await ready();
 const {rows}=await pool().query<ProjectProgress>(`SELECT p.id,p.code,p.title,p.status,
  count(t.id) FILTER (WHERE t.status='Completato')::int AS completed,
  count(t.id) FILTER (WHERE t.status<>'Non applicabile')::int AS total
  FROM tailor_projects p
  LEFT JOIN tailor_project_phases f ON f.client_id=p.client_id AND f.project_id=p.id
  LEFT JOIN tailor_project_tasks t ON t.client_id=f.client_id AND t.phase_id=f.id
  WHERE p.client_id=$1
  GROUP BY p.id ORDER BY p.updated_at DESC,p.code`,[client]);
 return rows;
}
export async function listProjects(client:string){await ready();const r=await pool().query(`SELECT ${columns} FROM tailor_projects WHERE client_id=$1 ORDER BY updated_at DESC,code`,[client]);return r.rows.map(project);}
export async function projectDetail(client:string,id:string){await ready();if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Identificativo non valido.');const r=await pool().query(`SELECT ${columns} FROM tailor_projects WHERE client_id=$1 AND id=$2`,[client,id]);if(!r.rowCount)throw Error('Commessa non trovata.');const diary=await pool().query("SELECT id,kind,text,actor,to_char(occurred_on,'YYYY-MM-DD') AS date,created_at FROM tailor_project_diary WHERE client_id=$1 AND project_id=$2 ORDER BY occurred_on DESC,created_at DESC",[client,id]);const contexts=await pool().query('SELECT id,context_markdown AS "contextMarkdown",payload,created_at AS "createdAt" FROM tailor_project_context WHERE client_id=$1 AND project_id=$2 ORDER BY created_at,id',[client,id]);return {contexts:contexts.rows,project:project(r.rows[0]),diary:diary.rows.map(r=>({id:r.id,kind:r.kind,text:r.text,actor:r.actor,occurredOn:r.date,createdAt:new Date(r.created_at).toISOString()} as DiaryEntry))};}
export async function saveProject(client:string,input:unknown,actor:string,id?:string,version?:number,modelId?:string){
 await ready();const f=validateProject(input);if(id&&(!/^[0-9a-f-]{36}$/i.test(id)||typeof version!=='number'||!Number.isInteger(version)||version<1))throw Error('Versione commessa non valida.');
 const c=await pool().connect();try{await c.query('BEGIN');let old:Record<string,unknown>|undefined;
 if(id){const r=await c.query(`SELECT ${columns} FROM tailor_projects WHERE client_id=$1 AND id=$2 FOR UPDATE`,[client,id]);old=r.rows[0];if(!old)throw Error('Commessa non trovata.');if(old.version!==version)throw Error('La commessa è stata aggiornata da un’altra operazione. Ricaricala prima di salvare.');if(old.code!==f.code)throw Error('Il codice commessa è stabile e non può essere modificato.');}
 let ownerName=f.owner;if(f.ownerId){const person=await c.query('SELECT display_name,active FROM tailor_team WHERE client_id=$1 AND id=$2 FOR SHARE',[client,f.ownerId]);if(!person.rowCount||(!person.rows[0].active&&old?.owner_id!==f.ownerId))throw Error('Responsabile non disponibile in questo ambiente.');ownerName=person.rows[0].display_name;}
 const projectId=id??crypto.randomUUID();const args=[projectId,client,f.code,f.title,f.customer,ownerName,f.status,f.dueDate,f.description,f.expectedValue??null];
 if(id)await c.query('UPDATE tailor_projects SET title=$4,customer=$5,owner=$6,status=$7,due_date=$8,description=$9,expected_value=$10,version=version+1,updated_at=now() WHERE id=$1 AND client_id=$2 AND code=$3',args);
 else await c.query('INSERT INTO tailor_projects(id,client_id,code,title,customer,owner,status,due_date,description,expected_value) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',args);
 await c.query('UPDATE tailor_projects SET owner_id=$3 WHERE client_id=$1 AND id=$2',[client,projectId,f.ownerId??null]);
 if(!id&&modelId){const {instantiateModel}=await import('./workflow-store');await instantiateModel(c,client,projectId,modelId);}
 const changes: string[]=[];if(old){const previous=project(old);const labels:Record<string,string>={title:'Titolo',customer:'Committente',owner:'Responsabile',ownerId:'Persona responsabile',status:'Stato',dueDate:'Scadenza',description:'Descrizione',expectedValue:'Valore previsto EUR'};for(const k of Object.keys(labels) as (keyof typeof labels)[]){const before=previous[k as keyof Project];const after=f[k as keyof typeof f];if(before!==after)changes.push(`${labels[k]}: ${before||'—'} → ${after||'—'}`);}}
 const text=old?(changes.length?changes.join('\n'):'Scheda salvata senza variazioni.'): `Apertura commessa ${f.code} · ${f.title}. Stato: ${f.status}.`;
 await c.query("INSERT INTO tailor_project_diary(id,client_id,project_id,kind,text,actor,occurred_on) VALUES($1,$2,$3,$4,$5,$6,(now() AT TIME ZONE 'Europe/Rome')::date)",[crypto.randomUUID(),client,projectId,old?'updated':'created',text,actor]);await c.query('COMMIT');return projectId;
 }catch(e){await c.query('ROLLBACK');if((e as {code?:string}).code==='23505')throw Error('Esiste già una commessa con questo codice per il cliente.');throw e;}finally{c.release();}
}
export async function addProjectNote(client:string,id:string,input:unknown,actor:string){await ready();const n=validateDiary(input);if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Identificativo non valido.');const r=await pool().query("INSERT INTO tailor_project_diary(id,client_id,project_id,kind,text,actor,occurred_on) SELECT $1,$2,id,'note',$4,$5,$6 FROM tailor_projects WHERE client_id=$2 AND id=$3 RETURNING id",[crypto.randomUUID(),client,id,n.text,actor,n.occurredOn]);if(!r.rowCount)throw Error('Commessa non trovata.');}




