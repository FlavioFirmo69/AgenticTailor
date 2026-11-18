import {test} from 'node:test';
import assert from 'node:assert/strict';
import {route,available,makeEvent,dayFor,manualEvent,calendarIntent,calendarAppointments,generalConversationHistory,resetConversation,emptyState,type Message} from '../lib/domain.ts';
test('domanda generale senza attivazioni',()=>assert.equal(route('Quali sono i monumenti di Roma?'),'general'));
test('calendario e seguito contestuale',()=>{assert.equal(route('Cerca disponibilità domani'),'calendar');assert.equal(route('il secondo',{id:'1',role:'assistant',agent:'calendar',text:''}),'calendar');});
test('prenotazione ricontrolla sovrapposizioni',()=>{const e=makeEvent('2026-11-12T09:00:00',[]);assert(!available('2026-11-12',[e]).includes(e.start));assert.throws(()=>makeEvent(e.start,[e]));});
test('orari fuori apertura e weekend rifiutati',()=>{assert.throws(()=>makeEvent('2026-11-14T09:00:00',[]));assert.throws(()=>makeEvent('2026-11-12T23:00:00',[]));});
test('date valide e calendario Roma',()=>{assert.throws(()=>dayFor('2026-02-30'));assert.equal(dayFor('oggi',new Date('2026-11-11T23:30:00Z')),'2026-11-12');});

test('tutto il giorno accetta impegni esistenti, gli orari precisi restano controllati',()=>{const timed=manualEvent('2026-11-13T10:00:00',60,'Impegno',[]);const whole=manualEvent('2026-11-13T00:00:00',1440,'Promemoria',[timed],true);assert.equal(whole.allDay,true);assert.throws(()=>manualEvent('2026-11-13T10:30:00',60,'Sovrapposto',[timed]));});

test('gli appuntamenti di oggi consultano la data di Roma senza cercare slot',()=>{
 const request='Gli appuntamenti di oggi';
 const now=new Date('2026-11-17T23:30:00Z');
 const today=manualEvent('2026-11-18T10:00:00',60,'Incontro di oggi',[]);
 const allDay=manualEvent('2026-11-18T12:00:00',60,'Promemoria',[],true);
 const other=manualEvent('2026-11-19T10:00:00',60,'Incontro di domani',[]);
 assert.equal(route(request),'calendar');
 assert.equal(calendarIntent(request),'list');
 const answer=calendarAppointments(request,[other,today,allDay],false,now);
 assert.equal(answer,'Appuntamenti del 2026-11-18\nTutto il giorno — Promemoria\n10:00 — Incontro di oggi');
 assert.equal(calendarAppointments(request,[other],false,now),'Appuntamenti del 2026-11-18\nNessun appuntamento registrato.');
});
test('la ricerca di orari liberi resta distinta dalla consultazione',()=>{
 const list={id:'list',role:'assistant' as const,agent:'calendar',text:'',calendarIntent:'list' as const};
 const availability={...list,id:'available',calendarIntent:'availability' as const};
 assert.equal(calendarIntent('Che impegni ho oggi?',availability),'list');
 assert.equal(calendarIntent('Cerca disponibilità per un appuntamento oggi',list),'availability');
 assert.equal(route('E domani?',list),'calendar');
 assert.equal(calendarIntent('E domani?',list),'list');
 assert.equal(calendarIntent('E domani?',availability),'availability');
});

test('il contesto dell’assistente generale esclude richieste e risposte operative',()=>{
 const messages:Message[]=[
  {id:'1',role:'user',text:'Domanda libera'},
  {id:'2',role:'assistant',text:'Risposta libera'},
  {id:'3',role:'user',text:'Qual è la somma dei saldi dei conti?'},
  {id:'4',role:'assistant',agent:'finance',text:'Totale riservato'},
  {id:'5',role:'user',text:'Progetti in corso'},
  {id:'6',role:'assistant',agent:'projects',text:'Elenco operativo'},
 ];
 assert.deepEqual(generalConversationHistory(messages).map(message=>message.id),['1','2']);
});

test('nuova conversazione azzera il contesto dell’ambiente corrente e rifiuta una vista superata',()=>{
 const state=emptyState();
 const other=emptyState();
 const event=manualEvent('2026-11-18T09:00:00',60,'Appuntamento',[]);
 state.events.push(event);
 state.customMarkdown='Istruzioni';
 state.messages.push({id:'previous',role:'assistant',agent:'calendar',text:'Consulta',slots:['2026-11-19T09:00:00']});
 other.messages.push({id:'other',role:'user',text:'Altra conversazione'});
 assert.throws(()=>resetConversation(state,'stale'),/conversazione è cambiata/);
 assert.equal(state.messages.length,1);
 resetConversation(state,'previous');
 resetConversation(state,'previous');
 assert.deepEqual(state.messages,[]);
 assert.equal(route('E domani?',state.messages.at(-1)),'general');
 assert.deepEqual(state.events,[event]);
 assert.equal(state.customMarkdown,'Istruzioni');
 assert.equal(other.messages.length,1);
});
