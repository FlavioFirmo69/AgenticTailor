import type {Event} from './domain';
export type ExternalEvent=Event&{source:'second-brain'|'case'|'project';endKnown:boolean;location:string;status:string};
export type Publication={titleProvisional?:boolean;authorId?:string;stock?:{loaded:string;sold:string;available:string};sales?:{total:string;ebook:string;paperback:string;other:string;records:number};id:string;code:string;title:string;author:string;status:string;publicationDate:string|null;datePrecision:string;genre:string;synopsis:string;formatNotes:string;editions:{format:string;status:string;publicationDate:string|null;isbn:string}[]};
export function calendarRange(start:unknown,end:unknown){function date(v:unknown):asserts v is string{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Intervallo del calendario non valido.');}date(start);date(end);if(end<start||(Date.parse(end)-Date.parse(start))/86400000>93)throw Error('Seleziona un intervallo massimo di 93 giorni.');return {start,end};}
export function externalEvent(row:Record<string,unknown>):ExternalEvent{
 const date=String(row.date),time=row.start?String(row.start):null,end=row.end?String(row.end):null;calendarRange(date,date);
 const next=new Date(Date.parse(date)+86400000).toISOString().slice(0,10);
 const start=time?date+'T'+time:date+'T00:00:00';
 return {id:'sb2:'+String(row.id),title:String(row.title),start,end:!time?next+'T00:00:00':end?date+'T'+end:start,allDay:!time,source:'second-brain',endKnown:!time||Boolean(end),location:String(row.location??''),status:String(row.status??'')};
}
const calendarSourceLabels:Record<ExternalEvent['source'],string>={
 'second-brain':'Calendario storico (Second Brain)',case:'Pratiche',project:'Commesse'
};

export function checkExternalConflicts(start:string,end:string,events:ExternalEvent[]){
 for(const event of events){
  if(event.allDay||event.blocking===false)continue;
  const date=event.start.slice(0,10);
  const day=date.split('-').reverse().join('/');
  const details='«'+event.title+'» · '+day+' · '+calendarSourceLabels[event.source];
  if(!event.endKnown&&date===start.slice(0,10)&&end>event.start){
   throw Error(details+': inizio alle '+event.start.slice(11,16)+', orario di fine mancante. Non posso verificare se si sovrappone al nuovo appuntamento. Completa l’orario di fine nel modulo di origine.');
  }
  if(start<event.end&&end>event.start){
   throw Error(details+': orario occupato dalle '+event.start.slice(11,16)+' alle '+event.end.slice(11,16)+'. Scegli un altro orario.');
  }
 }
}
