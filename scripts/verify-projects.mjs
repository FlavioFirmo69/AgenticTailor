// Verifica locale con dati temporanei identificati, rimossi al termine.
import env from '@next/env';
import pg from 'pg';
import assert from 'node:assert/strict';
env.loadEnvConfig(process.cwd());
const origin='http://127.0.0.1:3000';
async function api(path,body){const r=await fetch(origin+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);return {status:r.status,data:await r.json()};}
const admin=await api('/api/admin');assert.equal(admin.status,200);const enabledBefore=Object.fromEntries(admin.data.installations.map(i=>[i.id,i.enabledAgents.includes('projects')]));
const code='TEST-'+Date.now();let id;const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
try{
 for(const client of ['engineering','writer'])assert.equal((await api('/api/admin',{client,agent:'projects',enabled:true})).status,200);
 const fields={code,title:'Verifica temporanea modulo Commesse',customer:'Committente fittizio',owner:'Responsabile demo',status:'Da valutare',dueDate:'2026-12-01',description:'Dato di prova eliminato al termine.'};
 let r=await api('/api/projects',{client:'engineering',action:'save',fields});assert.equal(r.status,200);id=r.data.id;
 const detail=await api('/api/projects?client=engineering&id='+id);assert.equal(detail.data.project.code,code);assert.equal(detail.data.diary.length,1);
 assert.equal((await api('/api/projects',{client:'engineering',action:'save',fields})).status,400);
 assert.equal((await api('/api/projects?client=writer&id='+id)).status,400);
 assert.equal((await api('/api/projects',{client:'engineering',action:'save',id,version:1,fields:{...fields,status:'Attiva'}})).status,200);
 assert.equal((await api('/api/projects',{client:'engineering',action:'save',id,version:1,fields})).status,400);
 assert.equal((await api('/api/projects',{client:'engineering',action:'note',id,note:{text:'Nota temporanea',occurredOn:'2026-11-11'}})).status,200);
 const after=await api('/api/projects?client=engineering&id='+id);assert.equal(after.data.project.version,2);assert.equal(after.data.project.status,'Attiva');assert.equal(after.data.diary.length,3);assert(after.data.diary.some(n=>n.text.includes('Da valutare → Attiva')));
 await api('/api/admin',{client:'engineering',agent:'projects',enabled:false});assert.equal((await api('/api/projects?client=engineering')).status,400);
 console.log('Verificati: persistenza PostgreSQL, codice duplicato, isolamento, versioni concorrenti, diario e disattivazione.');
}finally{
 if(id){await c.query('BEGIN');try{await c.query('DELETE FROM tailor_project_diary WHERE client_id=$1 AND project_id=$2',['engineering',id]);await c.query('DELETE FROM tailor_projects WHERE client_id=$1 AND id=$2 AND code=$3',['engineering',id,code]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}}
 await c.end();for(const client of ['engineering','writer'])await api('/api/admin',{client,agent:'projects',enabled:enabledBefore[client]});
}
