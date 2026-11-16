import {test} from 'node:test';import assert from 'node:assert/strict';
import {personalWeek,agendaDay,remainingWeekDays} from '../lib/home-agenda-domain.ts';
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
