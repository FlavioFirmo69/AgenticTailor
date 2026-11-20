import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,resetConversation} from '../lib/domain.ts';
import {editorialPlanReply,handlesEditorialRequest,isEditorialRequest} from '../lib/editorial-plan.ts';
import {editCalendarEvent} from '../lib/calendar-move.ts';

const book={id:'a',title:'Il romanzo di esempio',code:'ROM'};
const now=new Date('2026-11-20T10:00:00Z');

test('bozza editoriale confermata una volta sola, con copie di prova prima dell’invio',()=>{
 const state=emptyState();
 state.enabledAgents=['calendar'];
 assert.match(editorialPlanReply(state,'Pianifica la pubblicazione del romanzo', [book],now),/quale romanzo/);
 assert.match(editorialPlanReply(state,book.title,[book],now),/2026-11-23/);
 assert.equal(state.events.length,0);
 assert.match(editorialPlanReply(state,'Devo anche ordinare tre copie bozza',[book],now),/Ordinare 3 copie di prova/);
 assert.match(editorialPlanReply(state,'Aggiungi controllare la descrizione il 2026-11-24',[book],now),/controllare la descrizione/);
 assert.match(editorialPlanReply(state,'Sposta controllare la descrizione al 2026-11-25',[book],now),/2026-11-25 · controllare la descrizione/);
 const steps=state.editorialDraft!.steps;
 assert.ok(steps.find(s=>s.key==='check-proof')!.date<steps.find(s=>s.key==='submit')!.date);
 assert.match(editorialPlanReply(state,'Generali',[book],now),/Create 8 attività/);
 assert.ok(state.events.every(event=>event.bookId===book.id&&event.allDay));
 assert.equal(editCalendarEvent(state.events[0],{start:'2026-12-01T00:00:00',title:'Copertina approvata',duration:1440,allDay:true},[]).bookId,book.id);
 assert.match(editorialPlanReply(state,'Generali',[book],now),/Non ci sono/);
 assert.equal(state.events.length,8);
});

test('la conferma richiede Calendario e Nuova conversazione elimina solo la bozza',()=>{
 const state=emptyState();
 editorialPlanReply(state,book.code,[book],now);
 assert.match(editorialPlanReply(state,'Generali',[book],now),/Attiva Calendario/);
 state.messages.push({id:'m',role:'assistant',text:'Bozza'});
 resetConversation(state,'m');
 assert.equal(state.editorialDraft,undefined);
 assert.equal(state.events.length,0);
 assert.equal(isEditorialRequest('Vorrei la strategia di uscita del romanzo','editorial'),false);
 assert.equal(handlesEditorialRequest('Che tempo fa?',[book]),false);
});

test('la richiesta su Gabriella riconosce il titolo precedente e conserva solo cartaceo',()=>{
 const prompt='ho finito la stesura di Gabriella, ho anche cambiato il titolo. Vorrei pianificare la pubblicazione su amazon per ora in solo cartaceo. mi proponi una lista di attività da mettere in calendario dopo mia conferma?';
 const renamed={...book,title:'Titolo aggiornato',previousTitles:['Gabriella']};
 const state=emptyState();
 assert.equal(isEditorialRequest(prompt),true);
 assert.equal(handlesEditorialRequest(prompt,[]),true);
 assert.match(editorialPlanReply(state,prompt,[renamed],now),/Titolo aggiornato · solo cartaceo/);
 assert.match(editorialPlanReply(state,'Devo anche ordinare tre copie bozza',[renamed],now),/Inviare l’edizione cartacea/);
 assert.equal(state.events.length,0);
 const missing=emptyState();
 assert.match(editorialPlanReply(missing,prompt,[book],now),/quale romanzo/);
 assert.match(editorialPlanReply(missing,book.title,[book],now),/solo cartaceo/);
});

test('la richiesta di acquistare 3 copie in bozza resta nel piano dopo un ripiego all’assistente generale',()=>{
 const state=emptyState();
 state.enabledAgents=['calendar'];
 editorialPlanReply(state,'Pianifica la pubblicazione del romanzo '+book.title+' solo cartaceo',[book],now);
 const request="Aggiungo: inserisci l'acquisto di 3 copie in bozza dopo aver controllato lo stato della libreria KDP";
 assert.equal(isEditorialRequest(request,undefined,true),true);
 assert.equal(handlesEditorialRequest(request,[book]),true);
 const proposal=editorialPlanReply(state,request,[book],now);
 assert.match(proposal,/solo cartaceo/);
 assert.match(proposal,/Ordinare 3 copie di prova/);
 const steps=state.editorialDraft!.steps;
 const date=(key:string)=>steps.find(step=>step.key===key)!.date;
 assert.ok(date('proof-ready')<date('order-proof'));
 assert.ok(date('order-proof')<date('check-proof'));
 assert.ok(date('check-proof')<date('submit'));
 assert.ok(date('submit')<date('review'));
 assert.equal(state.events.length,0);
 editorialPlanReply(state,request,[book],now);
 assert.equal(state.editorialDraft!.steps.filter(step=>step.key==='order-proof').length,1);
});

test('salvare queste attività in agenda conferma la bozza invece di elencare gli appuntamenti',()=>{
 const state=emptyState();
 state.enabledAgents=['calendar'];
 editorialPlanReply(state,'Pianifica la pubblicazione del romanzo '+book.title,[book],now);
 editorialPlanReply(state,"Aggiungo: inserisci l'acquisto di 3 copie in bozza dopo aver controllato lo stato della libreria KDP",[book],now);
 const request="ora vorrei salvare queste attività nell'agenda";
 assert.equal(isEditorialRequest(request,'calendar',true),true);
 assert.equal(handlesEditorialRequest(request,[book]),true);
 assert.equal(isEditorialRequest(request,'calendar',false),false);
 assert.equal(handlesEditorialRequest('Mostrami gli appuntamenti in agenda',[book]),false);
 assert.equal(handlesEditorialRequest("Non salvare queste attività nell’agenda",[book]),false);
 assert.match(editorialPlanReply(state,request,[book],now),/Create 8 attività/);
 assert.equal(state.events.length,8);
 assert.ok(state.events.every(event=>event.bookId===book.id));
 assert.match(editorialPlanReply(state,request,[book],now),/Non ci sono/);
 assert.equal(state.events.length,8);
});
