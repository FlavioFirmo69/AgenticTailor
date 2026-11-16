import {test} from 'node:test';import assert from 'node:assert/strict';import {localDemoAllowed,allowedAdmin} from '../lib/auth-policy.ts';
test('amministratore locale: nessun bypass su Vercel, produzione o host remoto',()=>{
 assert.equal(localDemoAllowed('development',false,'127.0.0.1'),true);for(const [env,vercel,host,forced] of [['production',false,'localhost',false],['development',true,'localhost',false],['development',false,'example.com',false],['development',false,'localhost',true]] as const)assert.equal(localDemoAllowed(env,vercel,host,forced),false);
});
test('accesso online: soltanto email confermata dell’amministratore configurato',()=>{
 assert.equal(allowedAdmin({email:'Io@Example.com',email_confirmed_at:'2026-11-16'},'io@example.com'),true);assert.equal(allowedAdmin({email:'altro@example.com',email_confirmed_at:'2026-11-16'},'io@example.com'),false);assert.equal(allowedAdmin({email:'io@example.com'},'io@example.com'),false);assert.equal(allowedAdmin(null,'io@example.com'),false);assert.equal(allowedAdmin({email:'io@example.com',email_confirmed_at:'2026-11-16'},undefined),false);
});

import {accountCanAccess} from '../lib/auth-policy.ts';
test('account studio limitato al proprio ambiente, amministratore trasversale',()=>{const studio={email:'demo@example.com',admin:false,clients:['engineering']};assert.equal(accountCanAccess(studio,'engineering'),true);for(const c of ['personal','dentist','writer'])assert.equal(accountCanAccess(studio,c),false);assert.equal(accountCanAccess(null,'engineering'),false);assert.equal(accountCanAccess({...studio,admin:true},'personal'),true);});
