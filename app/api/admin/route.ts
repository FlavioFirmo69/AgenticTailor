import {NextRequest,NextResponse} from 'next/server';
import {agentCatalog,setAgentActivation} from '@/lib/catalog';
import {clients,validClient} from '@/lib/domain';
import {transact} from '@/lib/store';
import {requireSuperuser,isDemoSuperuser} from '@/lib/access';
import {ready} from '@/lib/projects-store';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{
 await requireSuperuser(req);await ready();
 const installations=await Promise.all(clients.filter(c=>!process.env.CLIENT_ID||c.id===process.env.CLIENT_ID).map(async c=>({...c,enabledAgents:await transact(c.id,s=>s.enabledAgents??[])})));
 return NextResponse.json({catalog:agentCatalog,installations,identity:{name:'Consulente',role:'superuser',mode:isDemoSuperuser(req)?'local-demo':'supabase'}});
}catch(e){return NextResponse.json({error:(e as Error).message},{status:403});}}
export async function POST(req:NextRequest){try{
 await requireSuperuser(req);await ready();
 if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==req.headers.get('host'))throw Error('Origine non consentita.');
 const b=await req.json();
 if(!validClient(b.client)||typeof b.enabled!=='boolean'||typeof b.agent!=='string')throw Error('Richiesta non valida.');
 if(process.env.CLIENT_ID&&b.client!==process.env.CLIENT_ID)throw Error('Cliente non abilitato.');
 const enabledAgents=await transact(b.client,s=>{s.enabledAgents=setAgentActivation(s.enabledAgents??[],b.agent,b.enabled);return s.enabledAgents;});
 return NextResponse.json({ok:true,enabledAgents});
}catch(e){return NextResponse.json({error:(e as Error).message},{status:403});}}
