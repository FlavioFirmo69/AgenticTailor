import nextEnv from '@next/env';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd());
if(!process.env.POSTGRES_ADMIN_URL){console.error('Configura POSTGRES_ADMIN_URL in .env.local con una connessione amministrativa a postgres.');process.exit(1);}
const c=new pg.Client({connectionString:process.env.POSTGRES_ADMIN_URL});
try{await c.connect();const found=await c.query('SELECT 1 FROM pg_database WHERE datname=$1',['AgenticTailor']);if(!found.rowCount){await c.query('CREATE DATABASE "AgenticTailor"');console.log('Database AgenticTailor creato.');}else console.log('Database AgenticTailor già presente.');}catch{console.error('Impossibile creare il database: controllare connessione e permesso CREATEDB.');process.exitCode=1;}finally{await c.end();}
