import {test} from 'node:test';import assert from 'node:assert/strict';
import {dayIndex,isoDay,ganttRange,ganttBar} from '../lib/gantt-domain.ts';
test('Gantt include scadenza e fine piano anche quando divergono',()=>{const late=ganttRange('2026-11-16','2026-12-11','2026-12-04');assert(late.planEnd>late.deadline);assert(late.planEnd<late.count);const early=ganttRange('2026-11-16','2026-12-04','2026-12-11');assert(early.planEnd<early.deadline);assert(early.deadline<early.count);});
test('date coincidenti mantengono entrambi i marcatori',()=>{const r=ganttRange('2026-11-16','2026-12-11','2026-12-11');assert(r.coincident);assert.equal(r.planEnd,r.deadline);});
test('barre inclusive e date stabili attraverso mesi e anni bisestili',()=>{assert.deepEqual(ganttBar('2026-11-16','2026-11-16',dayIndex('2026-11-16')),{left:0,width:1});assert.equal(isoDay(dayIndex('2028-02-28')+2),'2028-03-01');assert.equal(ganttBar('2026-11-30','2026-12-02',dayIndex('2026-11-16')).width,3);});
