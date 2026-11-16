import env from '@next/env';import pg from 'pg';import {mkdir,writeFile,rm} from 'node:fs/promises';import path from 'node:path';
import {tableNames,fingerprints,sameData,secureSql,createBackup,command,quoteIdentifier,migrationConnection} from './migration-lib.mjs';
env.loadEnvConfig(process.cwd());
const mode=process.argv.includes('--apply')?'apply':process.argv.includes('--backup')?'backup':'plan';
const sourceUrl=process.env.MIGRATION_SOURCE_URL||process.env.LOCAL_DATABASE_URL||process.env.DATABASE_URL,targetUrl=process.env.SUPABASE_MIGRATION_URL?migrationConnection(process.env.SUPABASE_MIGRATION_URL):null;
if(!sourceUrl){console.error('DATABASE_URL non configurata.');process.exit(1);}
const source=new pg.Client({connectionString:sourceUrl,connectionTimeoutMillis:10000}),target=targetUrl?new pg.Client({connectionString:targetUrl,connectionTimeoutMillis:10000}):null;
const folder=path.resolve('data/backups/supabase-'+new Date().toISOString().replace(/[:.]/g,'-'));
let sourceTx=false,targetTx=false;
try{
 await source.connect();await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ');sourceTx=true;await source.query("SET LOCAL TIME ZONE 'UTC'");
 const tables=await tableNames(source);if(!tables.includes('tailor_demo_state')||!tables.includes('tailor_schema_migrations'))throw Error('La sorgente non contiene un archivio Agentic Tailor completo.');
 // A short write freeze keeps every row and binary attachment on one snapshot.
 if(mode!=='plan')await source.query('LOCK TABLE '+tables.map(t=>'public.'+quoteIdentifier(t)).join(',')+' IN SHARE MODE');
 const baseline=await fingerprints(source,tables);console.log('Sorgente Agentic Tailor: '+tables.length+' tabelle, '+baseline.reduce((n,t)=>n+t.rows,0)+' record.');for(const t of baseline)console.log(t.table+': '+t.rows);
 if(mode==='backup'){await createBackup(source,sourceUrl,folder,tables,{fingerprints:baseline});console.log('Backup completo di record e allegati: '+folder);}
 else{
  if(!target)throw Error('Aggiungere SUPABASE_MIGRATION_URL a .env.local. DATABASE_URL resta la sorgente attuale.');
  const targetAddress=new URL(targetUrl);if(!process.argv.includes('--test-target')&&targetAddress.port==='6543')throw Error('Per migrare usare Direct connection o Session pooler, non Transaction pooler sulla porta 6543.');
  await target.connect();await target.query('BEGIN READ ONLY');targetTx=true;await target.query("SET LOCAL TIME ZONE 'UTC'");
  const same=(await source.query("SELECT current_database() AS db" )).rows[0];
  // A source marker in the target is sufficient to refuse self-import; the source itself is never changed.
  const targetTables=await tableNames(target);const targetDb=(await target.query('SELECT current_database() AS db')).rows[0].db;
  if(new URL(sourceUrl).hostname===targetAddress.hostname&&new URL(sourceUrl).port===targetAddress.port&&same.db===targetDb)throw Error('Sorgente e destinazione coincidono.');
  console.log('Destinazione raggiungibile. Tabelle Second Brain: '+(await target.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'sb2\\_%' ESCAPE '\\'")).rows[0].n+' (non verranno modificate).');
  if(targetTables.length){const actual=await fingerprints(target,targetTables);if(sameData(baseline,actual)){console.log('I dati Agentic Tailor risultano già presenti e identici. Nessuna scrittura eseguita.');}else throw Error('La destinazione contiene già tabelle Agentic Tailor differenti: trasferimento interrotto senza sovrascrivere dati.');}
  else if(mode==='plan'){console.log('Piano valido: importazione delle sole tabelle tailor_*, preservando sb2_*, auth e storage. Per trasferire: npm run db:supabase:apply.');}
  else{
   await target.query('ROLLBACK');targetTx=false;const dump=await createBackup(source,sourceUrl,folder,tables,{fingerprints:baseline});const restore=path.join(folder,'restore.sql'),secure=path.join(folder,'secure.sql');
   await command('pg_restore',['--no-owner','--no-acl','--file='+restore,dump]);await writeFile(secure,secureSql(tables));
   // psql wraps schema, rows, constraints and RLS/revokes in one transaction.
   await command('psql',['--no-psqlrc','--single-transaction','--set=ON_ERROR_STOP=1','--file='+restore,'--file='+secure],targetUrl);
   await target.query('BEGIN READ ONLY');targetTx=true;await target.query("SET LOCAL TIME ZONE 'UTC'");const actual=await fingerprints(target,tables);if(!sameData(baseline,actual))throw Error('Verifica dati non superata: non cambiare DATABASE_URL; conservare sorgente e backup.');
   const protectedTables=await target.query("SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY($1::text[]) AND c.relrowsecurity",[tables]);if(protectedTables.rows[0].n!==tables.length)throw Error('Verifica RLS non superata: non cambiare DATABASE_URL.');
   await writeFile(path.join(folder,'verified.json'),JSON.stringify({verifiedAt:new Date().toISOString(),tables:actual,rls:true},null,2));await rm(restore);await rm(secure);console.log('Trasferimento verificato: record, contenuti e allegati identici; RLS attiva.');console.log('Backup e rapporto: '+folder);console.log('DATABASE_URL non è stata cambiata. Prima del passaggio definitivo impedire nuove scritture locali e ripetere il controllo.');
  }
 }
}catch(e){console.error((e instanceof Error&&/^(Aggiungere|Per migrare|La sorgente|Sorgente e|La destinazione|Verifica|pg_|psql|Impossibile)/.test(e.message))?e.message:'Operazione non completata. Controllare connessione, permessi e disponibilità PostgreSQL; nessuna credenziale viene stampata.');process.exitCode=1;}
finally{if(targetTx)await target.query('ROLLBACK').catch(()=>{});if(sourceTx)await source.query('ROLLBACK').catch(()=>{});await target?.end().catch(()=>{});await source.end().catch(()=>{});}



