import {test} from 'node:test';import assert from 'node:assert/strict';
import {validateVisit,composeReport,imageMime} from '../lib/visits-domain.ts';
const valid={title:'Visita',date:'2026-11-12',place:'Cantiere',participants:'Mario',purpose:'Verifica',observations:'Canale visibile',decisions:'Rivedere tavola',actions:'Richiedere documento'};
test('visite: data reale e titolo obbligatori',()=>{assert.equal(validateVisit(valid).title,'Visita');assert.throws(()=>validateVisit({...valid,date:'2026-02-30'}));assert.throws(()=>validateVisit({...valid,title:'  '}));});
test('verbale conserva osservazioni senza dedurre informazioni dalle fotografie',()=>{const text=composeReport(valid,[{caption:'Canalizzazione',generated:true}]);assert.match(text,/BOZZA/);assert.match(text,/Canale visibile/);assert.match(text,/IMMAGINE DEMO GENERATA/);assert.doesNotMatch(text,/conforme/);});
test('upload: identifica formato dai byte e rifiuta testo o svg',()=>{assert.equal(imageMime(new Uint8Array([255,216,255,0])),'image/jpeg');assert.throws(()=>imageMime(new TextEncoder().encode('<svg/>')));});
