import env from '@next/env';import pg from 'pg';import assert from 'node:assert/strict';
env.loadEnvConfig(process.cwd());const url='http://127.0.0.1:3000';
async function api(p,body){const r=await fetch(url+p,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);return {status:r.status,d:await r.json()};}
const a=await api('/api/workflow?client=engineering');assert.equal(a.status,200);assert.equal(a.d.team.filter(m=>m.demo).length,5);const model=a.d.models.find(m=>m.name==='Studio tecnico · 10 fasi');assert(model);assert.equal(model.phases.length,10);
const projects=await api('/api/projects?client=engineering');for(const code of ['DEMO-BWH','DEMO-HLX']){const p=projects.d.projects.find(p=>p.code===code);assert(p);const w=await api('/api/workflow?client=engineering&project='+p.id);assert.equal(w.d.phases.length,10);assert.equal(w.d.phases.flatMap(p=>p.tasks).length,22);assert(w.d.phases.flatMap(p=>p.tasks).every(t=>t.assigneeId&&t.status==='Da fare'));}
let id;const c=new pg.Client({connectionString:process.env.DATABASE_URL});await c.connect();
try{
 const fields={code:'TEST-WF-'+Date.now(),title:'Prova temporanea workflow',customer:'',owner:'',ownerId:a.d.team[0].id,status:'Attiva',dueDate:null,description:''};let r=await api('/api/projects',{client:'engineering',action:'save',fields,modelId:model.id});assert.equal(r.status,200);id=r.d.id;
 let w=await api('/api/workflow?client=engineering&project='+id);assert.equal(w.d.phases.length,10);let task=w.d.phases[0].tasks[0];assert.equal(task.assigneeId,null);if(model.phases[0].tasks[0].estimate)assert.deepEqual(task.estimate,model.phases[0].tasks[0].estimate);
 assert.equal((await api('/api/workflow',{client:'engineering',action:'task',task:{...task,status:'In corso'}})).status,400);
 assert.equal((await api('/api/workflow',{client:'engineering',action:'task',task:{...task,status:'In corso',assigneeId:crypto.randomUUID()}})).status,400);
 assert.equal((await api('/api/workflow',{client:'engineering',action:'task',task:{...task,status:'In corso',assigneeId:a.d.team[0].id}})).status,200);
 assert.equal((await api('/api/workflow',{client:'engineering',action:'task',task:{...task,status:'In attesa',assigneeId:a.d.team[0].id}})).status,400);
 assert.equal((await api('/api/workflow',{client:'engineering',action:'apply-model',projectId:id,modelId:model.id})).status,400);
 const detail=await api('/api/projects?client=engineering&id='+id);assert(detail.d.diary.some(n=>n.text.includes('Da fare → In corso')));
 const foreign=await c.query('SELECT client_id,COUNT(*)::integer AS n FROM tailor_project_models GROUP BY client_id');assert(foreign.rows.every(r=>r.client_id==='engineering'));
 const teamForeign=await c.query('SELECT client_id,COUNT(*)::integer AS n FROM tailor_team GROUP BY client_id');assert(teamForeign.rows.every(r=>r.client_id==='engineering'));
 console.log('Verificati: demo 5 persone / 2 commesse / 10 fasi e 22 task ciascuna; istanze indipendenti; dati solo nello Studio tecnico; assegnatario obbligatorio e versionamento task; modello applicabile una sola volta; diario.');
}finally{if(id){await c.query('BEGIN');try{await c.query('DELETE FROM tailor_project_tasks WHERE client_id=$1 AND phase_id IN (SELECT id FROM tailor_project_phases WHERE client_id=$1 AND project_id=$2)',['engineering',id]);await c.query('DELETE FROM tailor_project_phases WHERE client_id=$1 AND project_id=$2',['engineering',id]);await c.query('DELETE FROM tailor_project_diary WHERE client_id=$1 AND project_id=$2',['engineering',id]);await c.query('DELETE FROM tailor_projects WHERE client_id=$1 AND id=$2',['engineering',id]);await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}}await c.end();}
