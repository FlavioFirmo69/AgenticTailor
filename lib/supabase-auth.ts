import {createServerClient} from '@supabase/ssr';
import type {NextRequest} from 'next/server';
import {allowedAdmin} from './auth-policy';
export function authConfigured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY&&process.env.ADMIN_EMAIL);}
export function authSettings(){if(!authConfigured())throw Error('Accesso online da configurare.');return {url:process.env.NEXT_PUBLIC_SUPABASE_URL!,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!};}
export const authCookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
const requests=new WeakMap<NextRequest,Promise<boolean>>();
export function authenticatedAdmin(req:NextRequest){
 let pending=requests.get(req);if(!pending){pending=(async()=>{if(!authConfigured())return false;const settings=authSettings();const supabase=createServerClient(settings.url,settings.key,{cookieOptions:authCookieOptions,cookies:{getAll:()=>req.cookies.getAll(),setAll(){/* La rotazione dei cookie viene applicata dal proxy. */}}});const {data,error}=await supabase.auth.getUser();return !error&&allowedAdmin(data.user,process.env.ADMIN_EMAIL);})().catch(()=>false);requests.set(req,pending);}return pending;
}
