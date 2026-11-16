import {Pool} from 'pg';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {State,emptyState} from './domain';
const globals=globalThis as unknown as {tailorPool?:Pool;tailorPoolUrl?:string;tailorLocks?:Map<string,Promise<unknown>>};
const locks=globals.tailorLocks??=new Map();
export const storageMode=()=>process.env.DATABASE_URL?(process.env.DATABASE_URL===process.env.SUPABASE_MIGRATION_URL?'Supabase · PostgreSQL':'PostgreSQL'):'Archivio locale demo';
export function pool(){const url=process.env.DATABASE_URL;if(!globals.tailorPool||globals.tailorPoolUrl!==url){void globals.tailorPool?.end().catch(()=>{});globals.tailorPool=new Pool({connectionString:url,max:5,connectionTimeoutMillis:10000});globals.tailorPoolUrl=url;}return globals.tailorPool;}
async function locked<T>(key:string,fn:()=>Promise<T>):Promise<T>{const old=locks.get(key)??Promise.resolve();const next=old.catch(()=>{}).then(fn);locks.set(key,next);try{return await next;}finally{if(locks.get(key)===next)locks.delete(key);}}
export async function transact<T>(client:string,fn:(s:State)=>T|Promise<T>):Promise<T>{
 return locked(client,async()=>{
  if(process.env.DATABASE_URL){
   const c=await pool().connect();try{await c.query('BEGIN');await c.query('CREATE TABLE IF NOT EXISTS tailor_demo_state(client_id text PRIMARY KEY, state jsonb NOT NULL)');await c.query('INSERT INTO tailor_demo_state VALUES($1,$2) ON CONFLICT DO NOTHING',[client,emptyState()]);const result=await c.query('SELECT state FROM tailor_demo_state WHERE client_id=$1 FOR UPDATE',[client]);const state=result.rows[0].state as State;const value=await fn(state);await c.query('UPDATE tailor_demo_state SET state=$2 WHERE client_id=$1',[client,state]);await c.query('COMMIT');return value;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  }
  if(process.env.VERCEL)throw Error('Configurare DATABASE_URL: archivio locale non disponibile in produzione.');
  const folder=path.join(process.cwd(),'data');await mkdir(folder,{recursive:true});const file=path.join(folder,client+'.json');let state:State;try{state=JSON.parse(await readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;state=emptyState();}const result=await fn(state);await writeFile(file+'.tmp',JSON.stringify(state,null,2));await rename(file+'.tmp',file);return result;
 });
}

