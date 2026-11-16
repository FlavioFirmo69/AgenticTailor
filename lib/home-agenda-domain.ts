import type {Event} from './domain';
export function personalWeek(now=new Date()){
 const start=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const end=new Date(start+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+(7-end.getUTCDay())%7);
 return {start,end:end.toISOString().slice(0,10)};
}
export function agendaDay(events:Event[],day:string){
 const unique=new Map(events.map(e=>[e.id,e]));
 return [...unique.values()].filter(e=>e.start.slice(0,10)<=day&&(e.end>day+'T00:00:00'||e.endKnown===false&&e.start.slice(0,10)===day)).sort((a,b)=>Number(Boolean(b.allDay))-Number(Boolean(a.allDay))||a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'it'));
}
export function remainingWeekDays(start:string,end:string){const days:string[]=[];const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);while(d.toISOString().slice(0,10)<=end){days.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}return days;}
