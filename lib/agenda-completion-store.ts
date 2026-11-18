import {pool} from './store';import {ready} from './projects-store';import type {Event,State} from './domain';
import {agendaDay,expiredNativeAppointment,personalWeek} from './home-agenda-domain';import {taskAgendaEvent} from './task-agenda-domain';
import {readSecondBrain} from './second-brain-store';import {marketingAgenda} from './marketing-store';
function key(v:unknown):asserts v is string{if(typeof v!=='string'||!/^(?:(?:task|sb2|case|project|marketing):)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))throw Error('Attività non valida.');}
export async function agendaCompletions(){await ready();return (await pool().query("SELECT a.event_key AS id,a.completed_at AS \"completedAt\" FROM tailor_agenda_completions a LEFT JOIN tailor_project_tasks t ON t.client_id=a.client_id AND a.event_key='task:'||t.id::text WHERE a.client_id='personal' AND a.completed_at IS NOT NULL AND (a.event_key NOT LIKE 'task:%' OR t.status='Completato')")).rows;}
export async function completeAgenda(input:Record<string,unknown>,state:State,actor:string){
 await ready();key(input.eventKey);if(!['complete','undo'].includes(String(input.action)))throw Error('Operazione non valida.');if(!state.enabledAgents?.includes('calendar'))throw Error('Calendario non attivo.');
 const eventKey=input.eventKey,today=personalWeek().start,c=await pool().connect();
 try{await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['personal:'+eventKey]);
 const old=(await c.query("SELECT * FROM tailor_agenda_completions WHERE client_id='personal' AND event_key=$1 FOR UPDATE",[eventKey])).rows[0];
 let alreadyCompleted=Boolean(old?.completed_at);if(alreadyCompleted&&eventKey.startsWith('task:'))alreadyCompleted=(await c.query("SELECT status FROM tailor_project_tasks WHERE client_id='personal' AND id=$1",[eventKey.slice(5)])).rows[0]?.status==='Completato';
 if(input.action==='complete'&&alreadyCompleted||input.action==='undo'&&!old?.completed_at){await c.query('COMMIT');return {ok:true,changed:false};}
 let snapshot:Record<string,unknown>;
 if(input.action==='undo'){
  if(!Number.isInteger(input.version)||input.version!==old.version)throw Error('La chiusura è stata aggiornata: ricarica prima di annullare.');
  snapshot=old.snapshot;
  if(snapshot.task){const task=snapshot.task as {id:string;status:string;versionAfter:number;projectId:string;title:string};const changed=await c.query("UPDATE tailor_project_tasks SET status=$2,version=version+1 WHERE client_id='personal' AND id=$1 AND version=$3 AND status='Completato'",[task.id,task.status,task.versionAfter]);if(!changed.rowCount)throw Error('Il task è stato modificato dopo la chiusura: apri la commessa per verificarlo.');await c.query("INSERT INTO tailor_project_diary(id,client_id,project_id,kind,text,actor,occurred_on) VALUES($1,'personal',$2,'updated',$3,$4,(now() AT TIME ZONE 'Europe/Rome')::date)",[crypto.randomUUID(),task.projectId,'Annullata la chiusura dalla home del task «'+task.title+'».',actor]);}
  await c.query("UPDATE tailor_agenda_completions SET completed_at=NULL,version=version+1,updated_at=now() WHERE client_id='personal' AND event_key=$1",[eventKey]);
 }else{
  let event:Event|undefined;let task:Record<string,unknown>|null=null;
  if(eventKey.startsWith('task:')){
   if(!state.enabledAgents?.includes('projects'))throw Error('Commesse non attivo.');
   const row=(await c.query("SELECT t.id,t.title,t.status,t.version,p.project_id AS \"projectId\",j.code AS \"projectCode\",to_char(t.due_date,'YYYY-MM-DD') AS \"dueDate\",to_char(t.planned_start,'YYYY-MM-DD') AS \"plannedStart\",to_char(t.planned_end,'YYYY-MM-DD') AS \"plannedEnd\" FROM tailor_project_tasks t JOIN tailor_project_phases p ON p.client_id=t.client_id AND p.id=t.phase_id JOIN tailor_projects j ON j.client_id=p.client_id AND j.id=p.project_id JOIN tailor_workspace_identities i ON i.client_id=t.client_id AND i.member_id=t.assignee_id AND i.identity_key='local-consultant' JOIN tailor_team m ON m.client_id=i.client_id AND m.id=i.member_id AND m.active WHERE t.client_id='personal' AND t.id=$1 AND j.status NOT IN ('Completata','Non acquisita','Annullata') FOR UPDATE OF t",[eventKey.slice(5)])).rows[0];
   if(!row||['Completato','Non applicabile'].includes(row.status))throw Error('Task non disponibile o già chiuso: aggiorna il riepilogo.');event=taskAgendaEvent(row)??undefined;
   task={id:row.id,status:row.status,versionAfter:row.version+1,projectId:row.projectId,title:row.title};
  }else if(eventKey.startsWith('marketing:')){
   const activity=(await marketingAgenda('personal',today,today)).find(a=>'marketing:'+a.id===eventKey);if(activity){const end=new Date(today+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1);event={id:eventKey,title:activity.channel+' · '+activity.title,start:today+'T00:00:00',end:end.toISOString().slice(0,10)+'T00:00:00',allDay:true,source:'marketing'};}
  }else if(eventKey.includes(':')){event=(await readSecondBrain('calendar',{start:today,end:today})).events.find(e=>e.id===eventKey);}
  else event=state.events.find(e=>e.id===eventKey);
  if(!event||!agendaDay([event],today).length&&!(event.allDay&&expiredNativeAppointment(event,today)))throw Error('L’attività non è più presente nella tua agenda di oggi.');
  snapshot={event,task};
  if(task){await c.query("UPDATE tailor_project_tasks SET status='Completato',version=version+1 WHERE client_id='personal' AND id=$1",[task.id]);await c.query("INSERT INTO tailor_project_diary(id,client_id,project_id,kind,text,actor,occurred_on) VALUES($1,'personal',$2,'updated',$3,$4,(now() AT TIME ZONE 'Europe/Rome')::date)",[crypto.randomUUID(),task.projectId,'Task «'+task.title+'» completato dalla home personale.',actor]);}
  await c.query("INSERT INTO tailor_agenda_completions(client_id,event_key,completed_at,snapshot) VALUES('personal',$1,now(),$2) ON CONFLICT(client_id,event_key) DO UPDATE SET completed_at=now(),snapshot=EXCLUDED.snapshot,version=tailor_agenda_completions.version+1,updated_at=now()",[eventKey,snapshot]);
 }
 await c.query("INSERT INTO tailor_agenda_completion_history(id,client_id,event_key,action,actor,snapshot) VALUES($1,'personal',$2,$3,$4,$5)",[crypto.randomUUID(),eventKey,input.action,actor,snapshot]);
 const result=(await c.query("SELECT version,completed_at AS \"completedAt\" FROM tailor_agenda_completions WHERE client_id='personal' AND event_key=$1",[eventKey])).rows[0];await c.query('COMMIT');return {ok:true,changed:true,...result};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
