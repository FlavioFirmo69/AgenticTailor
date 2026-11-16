import {createServerClient} from '@supabase/ssr';
import type {NextRequest} from 'next/server';
import {pool} from './store';
import {ready} from './projects-store';
import type {Account} from './auth-policy';
import {allowedAdmin} from './auth-policy';
export function authConfigured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY&&process.env.ADMIN_EMAIL);}
export function authSettings(){if(!authConfigured())throw Error('Accesso online da configurare.');return {url:process.env.NEXT_PUBLIC_SUPABASE_URL!,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!};}
export const authCookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
export async function accountForUser(user:{email?:string;email_confirmed_at?:string}|null):Promise<Account|null>{
 if(!user?.email||!user.email_confirmed_at)return null;const email=user.email.toLowerCase();
 if(allowedAdmin(user,process.env.ADMIN_EMAIL))return {email,admin:true,clients:[]};
 await ready();const r=await pool().query('SELECT client_id FROM tailor_workspace_access WHERE email=$1 AND active=true',[email]);return r.rowCount?{email,admin:false,clients:r.rows.map(r=>r.client_id)}:null;
}
const requests=new WeakMap<NextRequest,Promise<Account|null>>();
export function authenticatedAccount(req:NextRequest){let pending=requests.get(req);if(!pending){pending=(async()=>{if(!authConfigured())return null;const settings=authSettings();const supabase=createServerClient(settings.url,settings.key,{cookieOptions:authCookieOptions,cookies:{getAll:()=>req.cookies.getAll(),setAll(){}}});const {data,error}=await supabase.auth.getUser();return error?null:accountForUser(data.user);})().catch(()=>null);requests.set(req,pending);}return pending;}
export async function authenticatedAdmin(req:NextRequest){return Boolean((await authenticatedAccount(req))?.admin);}
