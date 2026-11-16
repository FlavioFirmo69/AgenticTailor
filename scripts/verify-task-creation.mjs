import env from '@next/env';import pg from 'pg';import assert from 'node:assert/strict';env.loadEnvConfig(process.cwd());
const db=new pg.Client({connectionString:process.env.DATABASE_URL});const projectId=crypto.randomUUID(),phaseId=crypto.randomUUID(),taskId=crypto.randomUUID();
async function post(overrides={}){const r=await fetch('http://127.0.0.1:3000/api/workflow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client:'personal',action:'task-create',projectId,phaseId,task:{id:taskId,title:'TEST aggiunta task',assigneeId:null,status:'Da fare',dueDate:'2027-01-07',note:'Test temporaneo'},...overrides})});return {status:r.status,data:await r.json()};}
await db.connect();try{
 await db.query("INSERT INTO tailor_projects(id,client_id,code,title,status) VALUES($1,'personal',$2,'TEST aggiunta task temporaneo','Attiva')",[projectId,'TESTADD'+projectId.slice(0,8)]);
 await db.query("INSERT INTO tailor_project_phases(id,client_id,project_id,position,title) VALUES($1,'personal',$2,1,'TEST fase temporanea')",[phaseId,projectId]);
 assert.equal((await post({client:'engineering'})).status,400);assert.equal((await post({projectId:crypto.randomUUID()})).status,400);
 let r=await post();assert.equal(r.status,200,JSON.stringify(r.data));assert.equal((await post()).status,200);
 const tasks=(await db.query("SELECT title,position,due_date::text FROM tailor_project_tasks WHERE client_id='personal' AND phase_id=$1",[phaseId])).rows;assert.equal(tasks.length,1);assert.equal(tasks[0].due_date,'2027-01-07');assert.equal(tasks[0].position,1);
 const bad=await post({task:{id:crypto.randomUUID(),title:'',status:'Da fare',note:''}});assert.equal(bad.status,400);
 console.log('OK: salvataggio task nella fase, scadenza, isolamento ambiente/commessa, titolo obbligatorio e ritentativo senza duplicati.');
}finally{await db.query("DELETE FROM tailor_project_diary WHERE client_id='personal' AND project_id=$1",[projectId]);await db.query("DELETE FROM tailor_project_tasks WHERE client_id='personal' AND phase_id=$1",[phaseId]);await db.query("DELETE FROM tailor_project_phases WHERE client_id='personal' AND id=$1",[phaseId]);await db.query("DELETE FROM tailor_projects WHERE client_id='personal' AND id=$1",[projectId]);await db.end();}
