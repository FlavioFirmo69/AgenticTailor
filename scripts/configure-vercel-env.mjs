// Trasferisce solo le variabili autorizzate alla CLI, tramite stdin: nessun segreto negli argomenti o nell'output.
import env from '@next/env';import {spawnSync} from 'node:child_process';import path from 'node:path';import fs from 'node:fs/promises';
env.loadEnvConfig(process.cwd());
const project=JSON.parse(await fs.readFile('.vercel/project.json','utf8'));
if(project.projectId!=='prj_74a84o75MZGP8vl3uK8iybA5IwOy'||project.orgId!=='team_LjlvN0jqqZZvMv7GW6ihw66J')throw Error('Destinazione Vercel inattesa.');
const onlyAuth=process.argv.includes('--auth-only');
const keys=onlyAuth?['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']:['DATABASE_URL','SECOND_BRAIN_SAME_DATABASE','NEXT_PUBLIC_SUPABASE_URL','ADMIN_EMAIL'];
const cache=path.resolve('.npm-cache').replaceAll('\\','/');
for(const key of keys){const value=process.env[key];if(!value)throw Error('Configurare '+key+' prima del trasferimento.');
 if(key==='NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'){
  let allowed=value.startsWith('sb_publishable_');try{allowed ||= JSON.parse(Buffer.from(value.split('.')[1]??'','base64url')).role==='anon';}catch{}
  if(!allowed)throw Error('Usare soltanto una chiave pubblicabile o anon.');
  const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:value}});if(!response.ok)throw Error('Supabase rifiuta la chiave pubblicabile: HTTP '+response.status);
 }
 const type=key.startsWith('NEXT_PUBLIC_')?'config':'secret';
 const command=`npx.cmd --yes vercel@65.16.0 env add ${key} --environment production,preview --type ${type} --force --yes --json --project ${project.projectId} --scope flavio-firmos-projects-49cbe64e`;
 const result=spawnSync('cmd.exe',['/d','/s','/c',command],{env:{...process.env,npm_config_cache:cache},input:value,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:1024*1024});
 if(result.status!==0){await fs.writeFile('data/deployment/env-'+key+'.log',(String(result.stdout??'')+'\n'+String(result.stderr??'')).replaceAll(value,'[REDACTED]'));throw Error('Configurazione Vercel non riuscita per '+key+'. Dettagli nel log locale riservato.');}
 console.log(key+': configurata su Production e Preview.');
}
