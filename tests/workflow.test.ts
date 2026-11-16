import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateMember,validateTask} from '../lib/workflow-domain.ts';
test('persona distinta da account, email facoltativa',()=>{assert.equal(validateMember({name:' Demo ',role:'Progettista',email:'',active:true}).name,'Demo');assert.throws(()=>validateMember({name:'Demo',role:'',email:'',active:true}));assert.throws(()=>validateMember({name:'Demo',role:'Socio',email:'non-email',active:true}));});
test('task da avviare richiede persona e non applicabile motivato',()=>{const base={status:'Da fare',note:'',assigneeId:null,dueDate:null};assert.equal(validateTask(base).assigneeId,null);assert.throws(()=>validateTask({...base,status:'In corso'}));assert.throws(()=>validateTask({...base,status:'Completato'}));assert.throws(()=>validateTask({...base,status:'Non applicabile'}));assert.equal(validateTask({...base,status:'Non applicabile',note:'Prestazione esclusa dal perimetro'}).status,'Non applicabile');});
