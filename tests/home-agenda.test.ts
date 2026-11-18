import {test} from 'node:test';import assert from 'node:assert/strict';
import {moveCalendarEvent,editCalendarEvent} from '../lib/calendar-move.ts';
import {personalWeek,agendaDay,remainingWeekDays,automaticCompletionDate,overdueAllDayAppointments} from '../lib/home-agenda-domain.ts';
test('home agenda: oggi a Roma, fine domenica e cambio data rispetto a UTC',()=>{
 assert.deepEqual(personalWeek(new Date('2026-11-16T10:00:00Z')),{start:'2026-11-16',end:'2026-11-22'});
 assert.deepEqual(personalWeek(new Date('2026-11-15T23:30:00Z')),{start:'2026-11-16',end:'2026-11-22'});
 assert.deepEqual(remainingWeekDays('2026-11-22','2026-11-22'),[]);
 assert.deepEqual(remainingWeekDays('2026-12-31','2027-01-03'),['2027-01-01','2027-01-02','2027-01-03']);
});
test('home agenda: giorno incluso, fine esclusiva, durata sconosciuta e niente doppioni',()=>{
 const span={id:'a',title:'Task su più giorni',start:'2026-11-15T00:00:00',end:'2026-11-18T00:00:00',allDay:true};
 const unknown={id:'b',title:'Appuntamento',start:'2026-11-16T09:00:00',end:'2026-11-16T09:00:00',endKnown:false};
 assert.deepEqual(agendaDay([span,span,unknown],'2026-11-16').map(x=>x.id),['a','b']);assert.deepEqual(agendaDay([span,unknown],'2026-11-18'),[]);
});

test('chiusura automatica a Roma dopo il giorno di fine, anche oltre mezzanotte',()=>{
 const event={id:'timed',title:'Appuntamento',start:'2026-11-18T23:30:00',end:'2026-11-19T01:00:00'};
 const before=personalWeek(new Date('2026-11-19T22:59:59Z')).start;
 const after=personalWeek(new Date('2026-11-19T23:00:00Z')).start;
 assert.equal(automaticCompletionDate(event,before),undefined);
 assert.equal(automaticCompletionDate(event,after),'2026-11-20');
 assert.equal(automaticCompletionDate({...event,autoCompletionReopened:true},after),undefined);
 assert.equal(automaticCompletionDate({...event,source:'second-brain'},after),undefined);
 assert.equal(automaticCompletionDate({...event,start:'2026-11-17T23:30:00'},after),undefined);
 const reopened={...event,autoCompletionReopened:true};
 assert.equal(moveCalendarEvent(reopened,'2026-11-20',[]).autoCompletionReopened,undefined);
 const edited=editCalendarEvent(reopened,{start:event.start,duration:90,allDay:false,title:'Nuovo titolo'},[]);
 assert.equal(edited.autoCompletionReopened,true);
});

test('Da recuperare include solo gli eventi nativi tutto il giorno aperti dopo la fine esclusiva',()=>{
 const event={id:'overdue',title:'Promemoria',start:'2026-11-18T00:00:00',end:'2026-11-21T00:00:00',allDay:true};
 const completed={...event,id:'closed'};
 const upcoming={...event,id:'upcoming',end:'2026-11-22T00:00:00'};
 const external={...event,id:'external',source:'second-brain' as const};
 const older={...event,id:'older',start:'2026-11-17T00:00:00'};
 assert.deepEqual(overdueAllDayAppointments([event],new Set(),'2026-11-20'),[]);
 assert.deepEqual(overdueAllDayAppointments([event,completed,upcoming,external,older],new Set([completed.id]),'2026-11-21'),[event]);
 const moved=moveCalendarEvent(event,'2026-11-22',[]);
 assert.equal(moved.id,event.id);
 assert.equal(moved.end,'2026-11-25T00:00:00');
 assert.deepEqual(overdueAllDayAppointments([moved],new Set(),'2026-11-21'),[]);
});
