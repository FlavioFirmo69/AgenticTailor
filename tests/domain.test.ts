import {test} from 'node:test';
import assert from 'node:assert/strict';
import {route,available,makeEvent,dayFor,manualEvent} from '../lib/domain.ts';
test('domanda generale senza attivazioni',()=>assert.equal(route('Quali sono i monumenti di Roma?'),'general'));
test('calendario e seguito contestuale',()=>{assert.equal(route('Cerca disponibilità domani'),'calendar');assert.equal(route('il secondo',{id:'1',role:'assistant',agent:'calendar',text:''}),'calendar');});
test('prenotazione ricontrolla sovrapposizioni',()=>{const e=makeEvent('2026-11-12T09:00:00',[]);assert(!available('2026-11-12',[e]).includes(e.start));assert.throws(()=>makeEvent(e.start,[e]));});
test('orari fuori apertura e weekend rifiutati',()=>{assert.throws(()=>makeEvent('2026-11-14T09:00:00',[]));assert.throws(()=>makeEvent('2026-11-12T23:00:00',[]));});
test('date valide e calendario Roma',()=>{assert.throws(()=>dayFor('2026-02-30'));assert.equal(dayFor('oggi',new Date('2026-11-11T23:30:00Z')),'2026-11-12');});

test('tutto il giorno accetta impegni esistenti, gli orari precisi restano controllati',()=>{const timed=manualEvent('2026-11-13T10:00:00',60,'Impegno',[]);const whole=manualEvent('2026-11-13T00:00:00',1440,'Promemoria',[timed],true);assert.equal(whole.allDay,true);assert.throws(()=>manualEvent('2026-11-13T10:30:00',60,'Sovrapposto',[timed]));});
