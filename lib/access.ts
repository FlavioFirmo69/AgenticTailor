import type {NextRequest} from 'next/server';
import {localDemoAllowed} from './auth-policy';
import {authenticatedAdmin} from './supabase-auth';
// Identità provvisoria solo nello sviluppo locale. Mai un login di produzione.
export function isDemoSuperuser(req:NextRequest){
 return localDemoAllowed(process.env.NODE_ENV,Boolean(process.env.VERCEL),req.nextUrl.hostname,process.env.AUTH_REQUIRE_LOGIN==='true');
}
export async function isSuperuser(req:NextRequest){return isDemoSuperuser(req)||await authenticatedAdmin(req);}
export async function requireSuperuser(req:NextRequest){if(!await isSuperuser(req))throw Error('Accesso amministratore richiesto.');}
// Il workspace personale usa per ora l'identità locale del consulente.
export async function requirePersonalAccess(req:NextRequest,client:string){if(client==='personal'||process.env.NODE_ENV==='production'||process.env.VERCEL)await requireSuperuser(req);}
