import type {Message} from './domain.ts';
import type {Project} from './projects-domain.ts';
import type {WorkPhase} from './workflow-domain.ts';

const statusQuestion=/^(?:(?:com\s*['’]?\s*[eè]|come\s+(?:va|procede))\s+(?:(?:la\s+)?situazione\s+)?|a\s+che\s+punto\s+(?:siamo|è)\s+)(?:(?:di|del(?:la)?|con|per)\s+)?(.+?)\s*[?!]?$|^(?:quali sono le\s+|mostra le\s+)?attivit[aà]\s+(?:aperte|da fare)\s+(?:di|per|della)\s+(.+?)\s*[?!]?$/i;
const switchCommand=/^(?:ho\s+)?(?:fissato|fissa|registra)\s+(?:lo\s+)?switch\b(.*)$/i;
const normalize=(text:string)=>text.normalize('NFD').replace(/\p{M}/gu,'').toUpperCase().replace(/[^\p{L}\p{N}]+/gu,'');
type ProjectRef=Pick<Project,'id'|'code'|'title'|'status'>;

export function consultingIntent(text:string){
 const status=text.match(statusQuestion);
 if(status)return {kind:'status' as const,name:status[1]??status[2]};
 const fixed=text.match(switchCommand);
 if(fixed)return {kind:'switch' as const,details:fixed[1]};
}

export function findConsultingProject(name:string,projects:ProjectRef[]){
 const query=normalize(name);
 if(!query)return undefined;
 const open=projects.filter(project=>['Attiva','In attesa'].includes(project.status));
 const exact=open.filter(project=>normalize(project.title)===query||normalize(project.code)===query);
 if(exact.length)return exact.length===1?exact[0]:undefined;
 const matching=open.filter(project=>query.length>=4&&[project.title,project.code].some(value=>normalize(value).includes(query)));
 return matching.length===1?matching[0]:undefined;
}

export function recentConsultingProject(messages:Message[]):string|undefined {
 // Use only the most recent assistant turn so an unrelated conversation cannot select a stale project.
 const answer=messages.findLast(message=>message.role==='assistant');
 return answer?.agent==='consulting'?answer.consultingProjectId:undefined;
}

export function switchDate(text:string):string|undefined {
 const input=text.trim().replace(/[.!]$/,'').replace(/^(?:in\s+data|per(?:\s+il)?|il)\s+/i,'');
 const iso=input.match(/^\d{4}-\d{2}-\d{2}$/)?.[0];
 const local=input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 const date=iso??(local?local[3]+'-'+local[2].padStart(2,'0')+'-'+local[1].padStart(2,'0'):undefined);
 if(date&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date)return date;
}

export function consultingSummary(project:ProjectRef,phases:WorkPhase[],scheduledSwitch?:string):string {
 const sections=phases.flatMap(phase=>{
  const open=phase.tasks.filter(task=>task.status!=='Completato'&&task.status!=='Non applicabile');
  if(!open.length)return [];
  return [phase.title+'\n'+open.map(task=>'• '+task.title+' · '+task.status+(task.dueDate?' · entro '+task.dueDate:'')).join('\n')];
 });
 const title=project.code+' · '+project.title+' · '+project.status;
 return [title,scheduledSwitch?'Switch fissato per il '+scheduledSwitch+'.':'',sections.length?'Attività ancora aperte\n'+sections.join('\n\n'):'Nessuna attività aperta nelle fasi.'].filter(Boolean).join('\n\n');
}
