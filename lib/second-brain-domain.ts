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
export function checkExternalConflicts(start:string,end:string,events:ExternalEvent[]){for(const e of events){if(e.allDay||e.blocking===false)continue;if(!e.endKnown&&e.start.slice(0,10)===start.slice(0,10)&&end>e.start)throw Error('Un impegno in agenda non ha un orario di fine: verifica la durata prima di prenotare.');if(start<e.end&&end>e.start)throw Error('Orario già occupato da un impegno in agenda.');}}

