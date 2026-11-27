import type {PoolClient} from 'pg';
import {pool} from './store';
import {ready} from './projects-store';
import {TeamMember,WorkflowModel,WorkPhase,validateMember,validateTask} from './workflow-domain';
import {validateEstimate,validateHoursPerDay} from './estimates-domain';
function id(value:unknown):asserts value is string{if(typeof value!=='string'||!/^[0-9a-f-]{36}$/i.test(value))throw Error('Identificativo non valido.');}
export async function saveModelEstimates(client:string,b:Record<string,unknown>,actor:string){
 await ready();id(b.id);const hoursPerDay=validateHoursPerDay(b.hoursPerDay);if(!Number.isInteger(b.version)||!Array.isArray(b.estimates))throw Error('Versione o stime del modello non valide.');
 const estimates=b.estimates as unknown[];const c=await pool().connect();try{await c.query('BEGIN');const r=await c.query('SELECT * FROM tailor_project_models WHERE client_id=$1 AND id=$2 FOR UPDATE',[client,b.id]);const m=r.rows[0];if(!m||m.version!==b.version)throw Error('Modello non trovato o aggiornato: ricaricare prima di salvare.');
 const phases=m.phases as WorkflowModel['phases'];if(estimates.length!==phases.length)throw Error('Il numero di fasi non corrisponde al modello.');
 const updated=phases.map((p,i)=>{const phaseEstimates=estimates[i];if(!Array.isArray(phaseEstimates)||phaseEstimates.length!==p.tasks.length)throw Error('Il numero di task non corrisponde al modello.');return {...p,tasks:p.tasks.map((t,j)=>({...t,estimate:validateEstimate(phaseEstimates[j])}))};});
 await c.query('INSERT INTO tailor_project_model_versions(client_id,model_id,version,snapshot,actor) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',[client,m.id,m.version,{name:m.name,description:m.description,phases:m.phases,hoursPerDay:Number(m.hours_per_day)},actor]);
 await c.query('UPDATE tailor_project_models SET phases=$3,hours_per_day=$4,version=version+1 WHERE client_id=$1 AND id=$2',[client,m.id,JSON.stringify(updated),hoursPerDay]);
 await c.query('INSERT INTO tailor_project_model_versions(client_id,model_id,version,snapshot,actor) VALUES($1,$2,$3,$4,$5)',[client,m.id,m.version+1,{name:m.name,description:m.description,phases:updated,hoursPerDay},actor]);
 await c.query('COMMIT');return {version:m.version+1};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function listTeam(client:string):Promise<TeamMember[]>{await ready();const r=await pool().query('SELECT * FROM tailor_team WHERE client_id=$1 ORDER BY role,display_name',[client]);return r.rows.map(r=>({id:r.id,name:r.display_name,email:r.email,role:r.role,active:r.active,version:r.version,demo:Boolean(r.demo_key)}));}
export async function listModels(client:string):Promise<WorkflowModel[]>{await ready();const r=await pool().query('SELECT * FROM tailor_project_models WHERE client_id=$1 ORDER BY name',[client]);return r.rows.map(r=>({id:r.id,name:r.name,version:r.version,description:r.description,phases:r.phases,hoursPerDay:Number(r.hours_per_day)}));}
export async function instantiateModel(c:PoolClient,client:string,projectId:string,modelId:string){
 id(modelId);const r=await c.query('SELECT * FROM tailor_project_models WHERE client_id=$1 AND id=$2 FOR SHARE',[client,modelId]);if(!r.rowCount)throw Error('Modello non disponibile in questo ambiente.');
 const m=r.rows[0];await c.query('UPDATE tailor_projects SET model_id=$3,model_version=$4 WHERE client_id=$1 AND id=$2',[client,projectId,modelId,m.version]);
 let position=0;for(const phase of m.phases as WorkflowModel['phases']){const phaseId=crypto.randomUUID();await c.query('INSERT INTO tailor_project_phases(id,client_id,project_id,position,title) VALUES($1,$2,$3,$4,$5)',[phaseId,client,projectId,++position,phase.title]);let order=0;for(const task of phase.tasks)await c.query('INSERT INTO tailor_project_tasks(id,client_id,phase_id,position,title,expected_role,required,estimate_type,estimate_value) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[crypto.randomUUID(),client,phaseId,++order,task.title,task.role,task.required,task.estimate?.type??null,task.estimate?.value??null]);}
}
export async function workflow(client:string,projectId:string){await ready();id(projectId);const p=await pool().query('SELECT model_id,model_version FROM tailor_projects WHERE client_id=$1 AND id=$2',[client,projectId]);if(!p.rowCount)throw Error('Commessa non trovata.');const r=await pool().query('SELECT id,title,position,declared_status,status_note,status_version FROM tailor_project_phases WHERE client_id=$1 AND project_id=$2 ORDER BY position',[client,projectId]);const phases:WorkPhase[]=r.rows.map(p=>({...p,tasks:[]}));const t=await pool().query("SELECT t.*,to_char(t.due_date,'YYYY-MM-DD') AS date FROM tailor_project_tasks t JOIN tailor_project_phases p ON p.client_id=t.client_id AND p.id=t.phase_id WHERE p.client_id=$1 AND p.project_id=$2 ORDER BY p.position,COALESCE(t.due_date,t.planned_start) NULLS LAST,t.position",[client,projectId]);for(const row of t.rows)phases.find(p=>p.id===row.phase_id)!.tasks.push({id:row.id,title:row.title,phaseId:row.phase_id,assigneeId:row.assignee_id,expectedRole:row.expected_role,required:row.required,status:row.status,dueDate:row.date,note:row.note,version:row.version,estimate:row.estimate_type?{type:row.estimate_type,value:Number(row.estimate_value)}:null});return {phases,modelId:p.rows[0].model_id,modelVersion:p.rows[0].model_version};}
async function audit(c:PoolClient,client:string,projectId:string,text:string,actor:string){await c.query("INSERT INTO tailor_project_diary(id,client_id,project_id,kind,text,actor,occurred_on) VALUES($1,$2,$3,'note',$4,$5,(now() AT TIME ZONE 'Europe/Rome')::date)",[crypto.randomUUID(),client,projectId,text,actor]);}
export async function saveMember(client:string,b:Record<string,unknown>){await ready();const f=validateMember(b);if(!b.id){await pool().query('INSERT INTO tailor_team(id,client_id,display_name,email,role,active) VALUES($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),client,f.name,f.email,f.role,f.active]);return;}id(b.id);if(!Number.isInteger(b.version))throw Error('Versione anagrafica non valida.');const r=await pool().query('UPDATE tailor_team SET display_name=$3,email=$4,role=$5,active=$6,version=version+1 WHERE client_id=$1 AND id=$2 AND version=$7 RETURNING id',[client,b.id,f.name,f.email,f.role,f.active,b.version]);if(!r.rowCount)throw Error('Anagrafica aggiornata da un’altra operazione. Ricaricare.');}
export async function saveTask(client:string,b:Record<string,unknown>,actor:string){await ready();id(b.id);if(!Number.isInteger(b.version))throw Error('Versione task non valida.');const c=await pool().connect();try{await c.query('BEGIN');
 await c.query('SELECT p.id FROM tailor_projects p JOIN tailor_project_phases f ON f.client_id=p.client_id AND f.project_id=p.id JOIN tailor_project_tasks t ON t.client_id=f.client_id AND t.phase_id=f.id WHERE t.client_id=$1 AND t.id=$2 FOR NO KEY UPDATE OF p',[client,b.id]);
 const r=await c.query('SELECT t.*,p.project_id,p.title AS phase_title FROM tailor_project_tasks t JOIN tailor_project_phases p ON p.id=t.phase_id AND p.client_id=t.client_id WHERE t.client_id=$1 AND t.id=$2 FOR UPDATE OF t',[client,b.id]);const task=r.rows[0];if(!task||task.version!==b.version)throw Error('Task non trovato o aggiornato: ricaricare la commessa.');const f=validateTask(b,task.status==='Completato'&&!task.assignee_id);let person='Da assegnare';if(f.assigneeId){const member=await c.query('SELECT display_name,active FROM tailor_team WHERE client_id=$1 AND id=$2 FOR SHARE',[client,f.assigneeId]);if(!member.rowCount||!member.rows[0].active)throw Error('Scegliere una persona attiva di questo ambiente.');person=member.rows[0].display_name;}
 let phaseId=task.phase_id,position=task.position,moved='';
 if(b.phaseId!==undefined&&b.phaseId!==phaseId){
  id(b.phaseId);
  const phase=(await c.query('SELECT title FROM tailor_project_phases WHERE client_id=$1 AND project_id=$2 AND id=$3 FOR UPDATE',[client,task.project_id,b.phaseId])).rows[0];
  if(!phase)throw Error('Scegli una fase della stessa commessa.');
  phaseId=b.phaseId;
  position=(await c.query('SELECT COALESCE(MAX(position),0)+1 AS position FROM tailor_project_tasks WHERE client_id=$1 AND phase_id=$2',[client,phaseId])).rows[0].position;
  moved=' Fase «'+task.phase_title+'» → «'+phase.title+'».';
 }
 if(client==='personal'){
  const linked=(await c.query("SELECT id FROM tailor_project_events WHERE client_id=$1 AND project_id=$2 AND id=$3 AND status='planned' AND source_snapshot->>'kind'='consulting-switch' FOR UPDATE",[client,task.project_id,b.id])).rowCount;
  if(linked){
   if(!f.dueDate)throw Error('Indica la data dello switch prima di salvare.');
   await c.query('UPDATE tailor_project_events SET event_date=$4,version=version+1,updated_at=now() WHERE client_id=$1 AND project_id=$2 AND id=$3 AND event_date IS DISTINCT FROM $4::date',[client,task.project_id,b.id,f.dueDate]);
  }
 }
 await c.query('UPDATE tailor_project_tasks SET assignee_id=$3,status=$4,due_date=$5,note=$6,title=COALESCE($7,title),phase_id=$8,position=$9,version=version+1 WHERE client_id=$1 AND id=$2',[client,b.id,f.assigneeId,f.status,f.dueDate,f.note,f.title??null,phaseId,position]);await audit(c,client,task.project_id,`Task «${task.title}»${f.title&&f.title!==task.title?' → «'+f.title+'»':''}: ${task.status} → ${f.status}. Assegnatario: ${person}.${moved}${f.note?' Nota: '+f.note:''}`,actor);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
export async function applyModel(client:string,projectId:string,modelId:string,actor:string){await ready();id(projectId);const c=await pool().connect();try{await c.query('BEGIN');const p=await c.query('SELECT id,model_id FROM tailor_projects WHERE client_id=$1 AND id=$2 FOR UPDATE',[client,projectId]);if(!p.rowCount)throw Error('Commessa non trovata.');const exists=await c.query('SELECT id FROM tailor_project_phases WHERE client_id=$1 AND project_id=$2 LIMIT 1',[client,projectId]);if(exists.rowCount||p.rows[0].model_id)throw Error('La commessa ha già un modello o delle fasi.');await instantiateModel(c,client,projectId,modelId);await c.query('UPDATE tailor_projects SET version=version+1,updated_at=now() WHERE client_id=$1 AND id=$2',[client,projectId]);await audit(c,client,projectId,'Applicato modello di fasi e task con copia indipendente.',actor);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}

export async function savePhaseState(client:string,projectId:string,b:Record<string,unknown>,actor:string){
 await ready();id(projectId);id(b.id);
 const {validatePhaseDeclaration}=await import('./phase-domain');
 const change=validatePhaseDeclaration(b),db=await pool().connect();
 try{
  await db.query('BEGIN');
  await db.query('SELECT id FROM tailor_projects WHERE client_id=$1 AND id=$2 FOR NO KEY UPDATE',[client,projectId]);
  const old=(await db.query('SELECT title,declared_status,status_version FROM tailor_project_phases WHERE client_id=$1 AND project_id=$2 AND id=$3 FOR UPDATE',[client,projectId,b.id])).rows[0];
  if(!old||old.status_version!==b.version)throw Error('Fase non trovata o aggiornata: ricarica il percorso.');
  await db.query('UPDATE tailor_project_phases SET declared_status=$4,status_note=$5,status_version=status_version+1 WHERE client_id=$1 AND project_id=$2 AND id=$3',[client,projectId,b.id,change.status,change.note]);
  let closed=0;
  if(change.status==='Completata'){
   const result=await db.query(`UPDATE tailor_project_tasks SET status='Completato',version=version+1
    WHERE client_id=$1 AND phase_id=$2 AND status NOT IN ('Completato','Non applicabile')`,[client,b.id]);
   closed=result.rowCount??0;
  }
  const taskNote=closed?' · Task completati dalla fase: '+closed:'';
  await audit(db,client,projectId,'Fase «'+old.title+'»: '+(old.declared_status??'Automatico dai task')+' → '+(change.status??'Automatico dai task')+taskNote+(change.note?'. Nota: '+change.note:''),actor);
  await db.query('COMMIT');
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}

export async function createTask(client:string,projectId:string,phaseId:string,b:Record<string,unknown>,actor:string){
 await ready();id(projectId);id(phaseId);id(b.id);const f=validateTask(b);if(!f.title)throw Error('Indicare il titolo del task.');
 const c=await pool().connect();try{await c.query('BEGIN');
 const phase=(await c.query('SELECT title FROM tailor_project_phases WHERE client_id=$1 AND project_id=$2 AND id=$3 FOR UPDATE',[client,projectId,phaseId])).rows[0];if(!phase)throw Error('Fase non disponibile in questa commessa.');
 if(f.assigneeId){const member=await c.query('SELECT id FROM tailor_team WHERE client_id=$1 AND id=$2 AND active=true FOR SHARE',[client,f.assigneeId]);if(!member.rowCount)throw Error('Scegliere una persona attiva di questo ambiente.');}
 // Client-generated ID makes retries safe without inserting duplicate tasks.
 const existing=(await c.query('SELECT phase_id FROM tailor_project_tasks WHERE client_id=$1 AND id=$2',[client,b.id])).rows[0];
 if(existing){if(existing.phase_id!==phaseId)throw Error('Identificativo task già utilizzato.');await c.query('COMMIT');return;}
 await c.query('INSERT INTO tailor_project_tasks(id,client_id,phase_id,position,title,assignee_id,status,due_date,note,expected_role,required) SELECT $1,$2,$3,COALESCE(MAX(position),0)+1,$4,$5,$6,$7,$8,$9,false FROM tailor_project_tasks WHERE client_id=$2 AND phase_id=$3',[b.id,client,phaseId,f.title,f.assigneeId,f.status,f.dueDate,f.note,'']);
 await audit(c,client,projectId,'Aggiunto task «'+f.title+'» alla fase «'+phase.title+'».',actor);await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
