import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setAgentActivation} from '../lib/catalog.ts';
import {emptyState} from '../lib/domain.ts';
test('nuove installazioni senza agenti attivi',()=>assert.deepEqual(emptyState().enabledAgents,[]));
test('attivazione e disattivazione senza duplicati',()=>{const active=setAgentActivation([],'calendar',true);assert.deepEqual(setAgentActivation(active,'calendar',true),['calendar']);assert.deepEqual(setAgentActivation(active,'calendar',false),[]);});
test('agenti abbozzati e sconosciuti non attivabili',()=>{assert.throws(()=>setAgentActivation([],'marketing',true));assert.throws(()=>setAgentActivation([],'inventato',true));});
