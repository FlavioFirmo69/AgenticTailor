import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendarCreateRequest,calendarEveningRequest,calendarEveningRange,firstFreeEvening,calendarSearch,confirmsCalendarDraft,findCalendarEvents,parseCalendarDraft} from '../lib/calendar-chat.ts';

const now=new Date('2026-11-27T18:00:00Z');
test('cerca gli eventi già registrati per tema e data',()=>{
 const query=calendarSearch('Dimmi quali sono gli eventi di teatro',now)!;
 assert.equal(query.term,'teatro');
 const event=(id:string,title:string,start:string)=>({id,title,start,end:start});
 assert.deepEqual(findCalendarEvents([
  event('1','Lirica','2026-11-29T20:00:00'),
  event('2','Cena Teatro','2026-11-28T20:00:00'),
  event('3','Riunione','2026-11-28T19:00:00'),
  event('4','Teatro','2026-11-26T20:00:00')
 ],query).map(e=>e.id),['2','1']);
 assert.equal(calendarSearch('Quali sono gli appuntamenti di oggi?',now),undefined);
 assert.deepEqual(calendarSearch('Mostrami gli eventi di teatro domani',now),{term:'teatro',start:'2026-11-28',end:'2026-11-28'});
});

test('riconosce una proposta con orario o tutto il giorno senza salvarla',()=>{
 const text='Aggiungi in agenda Cena teatro domani alle 20:30 per 90 minuti';
 assert.equal(calendarCreateRequest(text),true);
 assert.deepEqual(parseCalendarDraft(text,now),{title:'Cena teatro',start:'2026-11-28T20:30:00',duration:90,allDay:false});
 assert.deepEqual(parseCalendarDraft('Inserisci un appuntamento Prova luci il 02/12/2026 tutto il giorno',now),{title:'Prova luci',start:'2026-12-02T00:00:00',duration:1440,allDay:true});
 assert.equal(parseCalendarDraft('Aggiungi in agenda Cena teatro domani',now),undefined);
 assert.equal(confirmsCalendarDraft('Conferma appuntamento'),true);
 assert.equal(confirmsCalendarDraft('Non confermare appuntamento'),false);
});


test('cerca la prima sera dopo la data richiesta, anche nel fine settimana',()=>{
 const text='dimmi la prima sera disponibile dopo il 9 dicembre';
 assert.equal(calendarEveningRequest(text),true);
 const range=calendarEveningRange(text,now)!;
 assert.deepEqual(range,{start:'2026-12-10',end:'2027-03-09'});
 assert.equal(calendarEveningRange('Prima sera libera dopo il 9 dicembre?',new Date('2026-12-20T12:00Z'))?.start,'2027-12-10');
 assert.equal(calendarEveningRange('Prima sera libera dopo il 31 novembre',now),undefined);
 assert.equal(firstFreeEvening([
  {id:'1',title:'Impegno senza fine',start:'2026-12-10T18:00:00',end:'2026-12-10T18:00:00',endKnown:false},
  {id:'2',title:'Cena',start:'2026-12-11T20:00:00',end:'2026-12-11T22:00:00'},
  {id:'3',title:'Promemoria',start:'2026-12-12T00:00:00',end:'2026-12-13T00:00:00',allDay:true},
 ],range,now),'2026-12-12');
});
