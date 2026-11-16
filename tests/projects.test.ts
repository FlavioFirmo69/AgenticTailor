import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateProject,validateDiary,isProjectRequest} from '../lib/projects-domain.ts';
const base={code:'st-001',title:'Incarico',customer:'',owner:'',status:'Da valutare',dueDate:null,description:''};
test('commessa generica con dati opzionali e codice normalizzato',()=>{const p=validateProject(base);assert.equal(p.code,'ST-001');assert.equal(p.customer,'');assert.equal(p.dueDate,null);});
test('campi obbligatori, stati e scadenze validati',()=>{assert.throws(()=>validateProject({...base,title:' '}));assert.throws(()=>validateProject({...base,code:'ST 001'}));assert.throws(()=>validateProject({...base,status:'Approvata tecnicamente'}));assert.throws(()=>validateProject({...base,dueDate:'2026-02-30'}));});
test('note con data evento indipendente dalla registrazione',()=>{assert.equal(validateDiary({text:' Decisione confermata ',occurredOn:'2026-11-11'}).text,'Decisione confermata');assert.throws(()=>validateDiary({text:'',occurredOn:'2026-11-11'}));assert.throws(()=>validateDiary({text:'Nota',occurredOn:'2026-02-30'}));});
test('routing commesse distinto da domande generiche',()=>{assert(isProjectRequest('Elenca le commesse'));assert(isProjectRequest('Quali incarichi sono attivi?'));assert(!isProjectRequest('Quali sono i monumenti di Roma?'));});

test('valore previsto euro: opzionale, decimale esatto e non negativo',()=>{assert.equal(validateProject({...base,expectedValue:'10000,50'}).expectedValue,'10000.50');assert.equal(validateProject({...base,expectedValue:''}).expectedValue,null);assert.equal(validateProject({...base,expectedValue:'0'}).expectedValue,'0.00');for(const value of ['-1','1.999','1e5',100])assert.throws(()=>validateProject({...base,expectedValue:value}));});
