import type {Event} from './domain';
export function personalWeek(now=new Date()){
 const start=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const end=new Date(start+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+(7-end.getUTCDay())%7);
 return {start,end:end.toISOString().slice(0,10)};
}
export function agendaRangeContains(event:Event,start:string,end:string):boolean{
 const day=event.start.slice(0,10);
 return day<=end&&(event.end>start+'T00:00:00'||event.endKnown===false&&day>=start);
}

export function canRescheduleHomeEvent(event:Event,today:string):boolean{
 if(event.source)return event.source==='case'&&Number.isInteger(event.sourceVersion)&&!event.completedAt&&agendaRangeContains(event,today,today);
 return !event.completedAt&&(agendaRangeContains(event,today,today)||
  Boolean(event.allDay&&expiredNativeAppointment(event,today)));
}
export function agendaDay(events:Event[],day:string){
 const unique=new Map(events.map(e=>[e.id,e]));
 return [...unique.values()].filter(e=>agendaRangeContains(e,day,day)).sort((a,b)=>Number(Boolean(b.allDay))-Number(Boolean(a.allDay))||a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'it'));
}
export function remainingWeekDays(start:string,end:string){const days:string[]=[];const d=new Date(start+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);while(d.toISOString().slice(0,10)<=end){days.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}return days;}

const overdueAgendaStart = '2026-11-18';

export function expiredNativeAppointment(event:Event, today:string):boolean {
 if(event.source || event.endKnown===false || event.start.slice(0,10)<overdueAgendaStart) return false;
 return event.allDay ? event.end<=today+'T00:00:00' : event.end.slice(0,10)<today;
}

export function automaticCompletionDate(event:Event, today:string):string|undefined {
 if(event.allDay || event.autoCompletionReopened || !expiredNativeAppointment(event,today)) return;
 const closed=new Date(event.end.slice(0,10)+'T12:00:00Z');
 closed.setUTCDate(closed.getUTCDate()+1);
 return closed.toISOString().slice(0,10);
}

export function overdueAllDayAppointments(events:Event[], completed:ReadonlySet<string>, today:string):Event[] {
 return events.filter(event=>event.allDay && !event.completedAt && !completed.has(event.id) && expiredNativeAppointment(event,today))
  .sort((a,b)=>a.end.localeCompare(b.end)||a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'it'));
}
