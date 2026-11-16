import {manualEvent,type Event} from './domain.ts';
export function moveCalendarEvent(event:Event,day:unknown,others:Event[]):Event{
 if(event.source)throw Error('Questo elemento va modificato nel modulo di origine.');
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)throw Error('Giorno non valido.');
 const delta=Date.parse(day)-Date.parse(event.start.slice(0,10));const shift=(s:string)=>new Date(Date.parse(s+'Z')+delta).toISOString().slice(0,19);
 const moved={...event,start:shift(event.start),end:shift(event.end)};
 if(!moved.allDay&&others.some(e=>e.id!==event.id&&e.blocking!==false&&moved.start<e.end&&moved.end>e.start))throw Error('Questo orario si sovrappone a un appuntamento esistente.');return moved;
}

export function editCalendarEvent(event:Event,input:{start:unknown;duration:unknown;title:unknown;allDay:unknown},others:Event[]):Event{if(event.source)throw Error('Questo elemento va modificato nel modulo di origine.');if(typeof input.allDay!=='boolean')throw Error('Opzione tutto il giorno non valida.');const updated=manualEvent(input.start,input.duration,input.title,others.filter(e=>e.id!==event.id),input.allDay);return {...event,...updated,id:event.id};}
