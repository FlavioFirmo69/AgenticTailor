import {test} from 'node:test';
import assert from 'node:assert/strict';
import {manualEvent} from '../lib/domain.ts';
test('tutto il giorno usa mezzanotte e fine esclusiva il giorno dopo',()=>{const e=manualEvent('2026-11-16T09:00:00',60,'Ferie',[],true);assert.equal(e.start,'2026-11-16T00:00:00');assert.equal(e.end,'2026-11-17T00:00:00');assert.equal(e.allDay,true);assert.throws(()=>manualEvent('2026-11-16T18:00:00',60,'Riunione',[e]));assert.doesNotThrow(()=>manualEvent('2026-11-17T00:00:00',60,'Riunione',[e]));});
test('durata in ore e promemoria tutto il giorno sovrapposto',()=>{const e=manualEvent('2026-11-16T09:00:00',480,'Giornata di lavoro',[]);assert.equal(e.end,'2026-11-16T17:00:00');assert.doesNotThrow(()=>manualEvent('2026-11-16T00:00:00',1440,'Ferie',[e],true));});
test('creazione manuale orario e durata liberi',()=>{const e=manualEvent('2026-11-15T18:30:00',90,'Riunione',[]);assert.equal(e.end,'2026-11-15T20:00:00');});
test('sovrapposizione rifiutata, appuntamenti consecutivi consentiti',()=>{const e=manualEvent('2026-11-16T09:15:00',45,'Primo',[]);assert.throws(()=>manualEvent('2026-11-16T09:30:00',60,'Secondo',[e]));assert.equal(manualEvent('2026-11-16T10:00:00',30,'Secondo',[e]).end,'2026-11-16T10:30:00');});
test('validazione data, titolo e durata',()=>{assert.throws(()=>manualEvent('2026-02-30T09:00:00',60,'Test',[]));assert.throws(()=>manualEvent('2026-11-16T25:00:00',60,'Test',[]));assert.throws(()=>manualEvent('2026-11-16T09:00:00',60,' ',[]));assert.throws(()=>manualEvent('2026-11-16T09:00:00',-30,'Test',[]));});
