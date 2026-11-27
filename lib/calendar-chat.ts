import {dayFor,manualEvent,type Event} from './domain.ts';

export type CalendarDraft={title:string;start:string;duration:number;allDay:boolean};
const create=/^(?:(?:vorrei|puoi)\s+)?(?:aggiung(?:i|ere)|inseris(?:ci|cire)|inserire|registra(?:re)?|crea(?:re)?|fissa(?:re)?|metti(?:re)?)\s+(?:(?:un\s+)?appuntamento\b(?:\s+(?:in\s+)?agenda\b)?|(?:in|nell['’])\s*agenda\b)[:\s]*/i;
const search=/^(?:(?:dimmi\s+)?quali sono\s+|(?:mostrami|elenca|cerca)\s+)?(?:gli?\s+)?(?:eventi|appuntamenti|impegni)\s+(?:di|del|per|su)\s+(.+?)\s*[?!]?$/i;
const dateWord=/\b(?:oggi|domani|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})\b/i;
export const calendarCreateRequest=(text:string)=>create.test(text);
export const confirmsCalendarDraft=(text:string)=>/^(?:conferma(?: l['’])?\s*appuntamento|salva(?: l['’])?\s*appuntamento|s[iì],?\s+salva)[.!]?$/i.test(text);
export const cancelsCalendarDraft=(text:string)=>/^annulla(?: la proposta| l['’]appuntamento)?[.!]?$/i.test(text);

function chatDay(value:string,now:Date){
 const parts=value.split('/');
 return dayFor(parts.length===3?parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0'):value,now);
}
export function parseCalendarDraft(text:string,now=new Date()):CalendarDraft|undefined{
 const body=text.replace(create,'').trim();
 const datePhrase=body.match(dateWord);
 if(!datePhrase)return;
 const time=body.match(/(?:^|\s)(?:alle\s+)?(\d{1,2})[:.](\d{2})(?=$|[\s.,!?])/i);
 const allDay=/\btutto il giorno\b/i.test(body);
 if((!time&&!allDay)||(time&&allDay))return;
 const minutes=body.match(/\b(?:per|durata(?: di)?)\s+(\d+)\s+(minut[oi]|or[ae])\b/i);
 const title=body.replace(datePhrase[0],' ').replace(time?.[0]??/(?!)/,' ').replace(minutes?.[0]??/(?!)/,' ')
  .replace(/\btutto il giorno\b/i,' ').replace(/\s+(?:il|per|alle)\s*$/i,'').trim().replace(/^[:«"']+|[.!?»:;"']+$/g,'').trim();
 if(!title)return;
 const start=chatDay(datePhrase[0],now)+'T'+(time?time[1].padStart(2,'0')+':'+time[2]:'00:00')+':00';
 const duration=allDay?1440:minutes?Number(minutes[1])*(/^or/i.test(minutes[2])?60:1):60;
 manualEvent(start,duration,title,[],allDay);
 return {title,start,duration,allDay};
}

export function calendarSearch(text:string,now=new Date()){
 const match=text.match(search)?.[1];
 if(!match)return;
 const datePhrase=match.match(dateWord);
 const term=match.replace(datePhrase?.[0]??/(?!)/,' ').replace(/\b(?:in agenda|in calendario)\b/gi,' ')
  .replace(/\s+(?:del|di|il)\s*$/i,'').trim().replace(/^["«]|["»]$/g,'');
 if(!term||term.length>120)return;
 const start=datePhrase?chatDay(datePhrase[0],now):dayFor('oggi',now);
 const endDate=new Date(start+'T12:00:00Z');
 if(!datePhrase)endDate.setUTCDate(endDate.getUTCDate()+89);
 return {term,start,end:endDate.toISOString().slice(0,10)};
}

export function findCalendarEvents(events:Event[],query:NonNullable<ReturnType<typeof calendarSearch>>){
 const simplify=(value:string)=>value.toLocaleLowerCase('it').normalize('NFD').replace(/\p{M}/gu,'');
 const term=simplify(query.term);
 return events.filter(event=>{
  const date=event.start.slice(0,10);
  if(date<query.start||date>query.end)return false;
  const title=simplify(event.title);
  if(/^teatr(?:o|ale|ali|i)$/.test(term))return /\b(?:teatr\w*|lirica)\b/.test(title);
  return title.includes(term);
 }).sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title,'it'));
}
export function calendarEventText(event:Event){
 return event.start.slice(0,10)+' · '+(event.allDay?'Tutto il giorno':event.start.slice(11,16))+' — '+event.title;
}
