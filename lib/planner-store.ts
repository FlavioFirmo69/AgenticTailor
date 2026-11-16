import {pool} from './store';import {ready} from './projects-store';
import {allocatePlan,periodMinutes,weekStart,DailyAllocation} from './planner-domain';
import {validPlanDate,workingMargin} from './planning-domain';import {dayIndex,isoDay} from './gantt-domain';
export type StudioTask={id:string;projectId:string;projectCode:string;projectTitle:string;phase:string;title:string;assigneeId:string|null;assignee:string;personActive:boolean;status:string;start:string;end:string;minutes:number;periodMinutes:number;daily:DailyAllocation[];flags:string[]};
export type StudioProject={id:string;code:string;title:string;status:string;deadline:string|null;planEnd:string|null;planStart:string|null;revision:number|null;plannedHours:number;periodHours:number;openTasks:number;late:boolean;noPlan:boolean};
export type StudioOverview={today:string;period:{start:string;end:string;kind:'week'|'month';automatic:boolean};projects:StudioProject[];tasks:StudioTask[];people:{id:string;name:string;role:string;active:boolean;periodMinutes:number;openMinutes:number;taskCount:number}[];alerts:{kind:string;title:string;projectId:string;projectCode:string;taskId?:string}[];updatedAt:string};
export async function studioOverview(client:string,options:{start?:string;kind?:string}={}):Promise<StudioOverview>{
 await ready();const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const c=await pool().connect();
 try{await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ');const p=await c.query("SELECT p.id,p.code,p.title,p.status,to_char(p.due_date,'YYYY-MM-DD') AS deadline,l.revision,l.snapshot FROM tailor_projects p LEFT JOIN LATERAL (SELECT revision,snapshot FROM tailor_project_plans WHERE client_id=p.client_id AND project_id=p.id ORDER BY revision DESC LIMIT 1) l ON true WHERE p.client_id=$1 AND p.status IN ('Attiva','In attesa') ORDER BY p.code",[client]);
 const current=await c.query('SELECT t.id,t.assignee_id,t.status,m.display_name,m.active FROM tailor_project_tasks t JOIN tailor_project_phases f ON f.client_id=t.client_id AND f.id=t.phase_id LEFT JOIN tailor_team m ON m.client_id=t.client_id AND m.id=t.assignee_id WHERE t.client_id=$1',[client]);const map=new Map(current.rows.map(t=>[t.id,t]));
 const members=await c.query('SELECT id,display_name,role,active FROM tailor_team WHERE client_id=$1 ORDER BY display_name',[client]);await c.query('COMMIT');
 const tasks:StudioTask[]=[],projects:StudioProject[]=[],alerts:StudioOverview['alerts']=[];
 for(const row of p.rows){const plan=row.snapshot;const project:StudioProject={id:row.id,code:row.code,title:row.title,status:row.status,deadline:row.deadline,planEnd:plan?.end??null,planStart:plan?.start??null,revision:row.revision??null,plannedHours:plan?.totalHours??0,periodHours:0,openTasks:0,late:Boolean(plan&&row.deadline&&workingMargin(plan.end,row.deadline)<0),noPlan:!plan};projects.push(project);
 if(!plan){alerts.push({kind:'no-plan',title:'Commessa attiva senza piano confermato',projectId:row.id,projectCode:row.code});continue;}
 if(project.late)alerts.push({kind:'deadline',title:`Fine pianificata ${plan.end} oltre la scadenza ${row.deadline}`,projectId:row.id,projectCode:row.code});
 const allocation=allocatePlan(plan.rows,plan.input.startDate,plan.hoursPerDay);
 for(const t of plan.rows){const live=map.get(t.id);const status=live?.status??'Non disponibile';const open=!['Completato','Non applicabile'].includes(status);const flags:string[]=[];if(open&&!live?.assignee_id)flags.push('Da assegnare');else if(open&&live&&!live.active)flags.push('Persona inattiva');if(open&&t.end<today)flags.push('Oltre fine pianificata');if(status==='In attesa')flags.push('In attesa');if(!live)flags.push('Task sorgente non disponibile');
 const task:StudioTask={id:t.id,projectId:row.id,projectCode:row.code,projectTitle:row.title,phase:t.phase,title:t.title,assigneeId:live?.assignee_id??null,assignee:live?.display_name??'Da assegnare',personActive:Boolean(live?.active),status,start:t.start,end:t.end,minutes:t.minutes,periodMinutes:0,daily:allocation[t.id]??[],flags};tasks.push(task);if(open)project.openTasks++;
 for(const flag of flags)alerts.push({kind:'task',title:`${t.title} · ${flag}`,projectId:row.id,projectCode:row.code,taskId:t.id});}
 }
 const kind=options.kind==='month'?'month':'week';let start=options.start?validPlanDate(options.start):weekStart(today),automatic=false;
 const endFor=(s:string)=>kind==='week'?isoDay(dayIndex(s)+6):new Date(Date.UTC(Number(s.slice(0,4)),Number(s.slice(5,7)),0,12)).toISOString().slice(0,10);
 if(!options.start&&!tasks.some(t=>periodMinutes(t.daily,start,endFor(start))>0)){const future=tasks.map(t=>t.start).filter(d=>d>=today).sort()[0];if(future){start=weekStart(future);automatic=true;}}
 if(kind==='month')start=start.slice(0,7)+'-01';else start=weekStart(start);const end=endFor(start);
 for(const task of tasks)task.periodMinutes=periodMinutes(task.daily,start,end);
 for(const project of projects)project.periodHours=tasks.filter(t=>t.projectId===project.id).reduce((sum,t)=>sum+t.periodMinutes,0)/60;
 const people=members.rows.map(m=>{const own=tasks.filter(t=>t.assigneeId===m.id&&t.periodMinutes>0);return {id:m.id,name:m.display_name,role:m.role,active:m.active,periodMinutes:own.reduce((s,t)=>s+t.periodMinutes,0),openMinutes:own.filter(t=>!['Completato','Non applicabile'].includes(t.status)).reduce((s,t)=>s+t.periodMinutes,0),taskCount:own.length};});
 return {today,period:{start,end,kind,automatic},projects,tasks,people,alerts,updatedAt:new Date().toISOString()};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
