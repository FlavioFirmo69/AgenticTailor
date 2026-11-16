import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {isDemoSuperuser} from './lib/access';
import {authConfigured,authSettings,authCookieOptions,accountForUser} from './lib/supabase-auth';


export async function proxy(request:NextRequest){
 const pathname=request.nextUrl.pathname;
 if(isDemoSuperuser(request))return NextResponse.next();
 if(pathname==='/login'||pathname==='/api/auth/login'||pathname==='/api/auth/logout')return NextResponse.next();
 function denied(){const response=pathname.startsWith('/api/')?NextResponse.json({error:'Autenticazione richiesta.'},{status:401}):NextResponse.redirect(new URL('/login',request.url));response.headers.set('Cache-Control','private, no-store');return response;}
 if(!authConfigured())return denied();
 let response=NextResponse.next({request});
 try{const settings=authSettings();const supabase=createServerClient(settings.url,settings.key,{cookieOptions:authCookieOptions,cookies:{getAll:()=>request.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});const {data,error}=await supabase.auth.getUser();
 const account=error?null:await accountForUser(data.user);
 if(!account){const rejected=denied();response.cookies.getAll().forEach(c=>rejected.cookies.set(c));return rejected;}
 if(!account.admin&&(pathname==='/admin'||pathname.startsWith('/demo/'))){const rejected=NextResponse.redirect(new URL('/',request.url));response.cookies.getAll().forEach(c=>rejected.cookies.set(c));return rejected;}
 response.headers.set('Cache-Control','private, no-store');return response;
 }catch{return denied();}
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|branding/|pdfjs/).*)']};
