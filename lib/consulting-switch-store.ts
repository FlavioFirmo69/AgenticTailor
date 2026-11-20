import {pool} from './store';
import {ready} from './projects-store';

export async function scheduledConsultingSwitch(client:string,projectId:string):Promise<string|undefined>{
 await ready();
 const result=await pool().query<{date:string}>(`SELECT to_char(event_date,'YYYY-MM-DD') AS date
  FROM tailor_project_events WHERE client_id=$1 AND project_id=$2 AND status='planned'
  AND source_snapshot->>'kind'='consulting-switch' ORDER BY created_at DESC,id DESC LIMIT 1`,[client,projectId]);
 return result.rows[0]?.date;
}

export async function saveConsultingSwitch(client:string,projectId:string,date:string,actor:string){
 await ready();
 const db=await pool().connect();
 try{
  await db.query('BEGIN');
  const project=await db.query("SELECT id FROM tailor_projects WHERE client_id=$1 AND id=$2 AND status IN ('Attiva','In attesa') FOR UPDATE",[client,projectId]);
  if(!project.rowCount)throw Error('Commessa aperta non disponibile.');
  const existing=(await db.query<{id:string;date:string}>(`SELECT id,to_char(event_date,'YYYY-MM-DD') AS date
   FROM tailor_project_events WHERE client_id=$1 AND project_id=$2 AND status='planned'
   AND source_snapshot->>'kind'='consulting-switch' ORDER BY created_at DESC,id DESC LIMIT 1 FOR UPDATE`,[client,projectId])).rows[0];
  let result:'unchanged'|'rescheduled'|'created'='unchanged';
  if(!existing){
   await db.query(`INSERT INTO tailor_project_events(id,client_id,project_id,title,event_date,location,status,source_snapshot)
    VALUES($1,$2,$3,'Switch',$4,'','planned','{"kind":"consulting-switch"}'::jsonb)`,[crypto.randomUUID(),client,projectId,date]);
   result='created';
  }else if(existing.date!==date){
   await db.query(`UPDATE tailor_project_events SET event_date=$4,version=version+1,updated_at=now()
    WHERE client_id=$1 AND project_id=$2 AND id=$3`,[client,projectId,existing.id,date]);
   result='rescheduled';
  }
  if(result!=='unchanged'){
   const note=existing?'Switch spostato dal '+existing.date+' al '+date+'.':'Switch fissato per il '+date+'.';
   await db.query(`INSERT INTO tailor_project_diary(id,client_id,project_id,kind,text,actor,occurred_on)
    VALUES($1,$2,$3,'note',$4,$5,(now() AT TIME ZONE 'Europe/Rome')::date)`,[crypto.randomUUID(),client,projectId,note,actor]);
  }
  await db.query('COMMIT');
  return result;
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
