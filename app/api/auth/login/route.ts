import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {authSettings,authCookieOptions} from '@/lib/supabase-auth';
import {allowedAdmin} from '@/lib/auth-policy';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{if(!req.headers.get('origin')||new URL(req.headers.get('origin')!).host!==req.headers.get('host'))return NextResponse.json({error:'Origine non consentita.'},{status:403});
 const {email,password}=await req.json();if(typeof email!=='string'||typeof password!=='string'||email.length>320||password.length>1024||!password||email.trim().toLowerCase()!==process.env.ADMIN_EMAIL?.trim().toLowerCase())return NextResponse.json({error:'Accesso non riuscito. Verifica le credenziali.'},{status:401});
 const settings=authSettings(),response=NextResponse.json({ok:true},{headers:{'Cache-Control':'private, no-store'}});
 const supabase=createServerClient(settings.url,settings.key,{cookieOptions:authCookieOptions,cookies:{getAll:()=>req.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error||!allowedAdmin(data.user,process.env.ADMIN_EMAIL)){await supabase.auth.signOut();const rejected=NextResponse.json({error:'Accesso non riuscito. Verifica le credenziali e l’abilitazione dell’account.'},{status:401,headers:{'Cache-Control':'private, no-store'}});response.cookies.getAll().forEach(c=>rejected.cookies.set(c));return rejected;}return response;
 }catch{return NextResponse.json({error:'Accesso non disponibile. Verifica la configurazione Supabase.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
}
