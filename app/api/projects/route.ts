import {requirePersonalAccess} from '@/lib/access';
import {NextRequest,NextResponse} from 'next/server';
import {validClient} from '@/lib/domain';
import {transact} from '@/lib/store';
import {listProjects,projectDetail,saveProject,addProjectNote} from '@/lib/projects-store';
import {isSuperuser} from '@/lib/access';
export const runtime='nodejs';
function check(client:string){if(!validClient(client)||process.env.CLIENT_ID&&process.env.CLIENT_ID!==client)throw Error('Cliente non abilitato.');}
export async function GET(req:NextRequest){try{const client=req.nextUrl.searchParams.get('client')??process.env.CLIENT_ID??'dentist';check(client);await requirePersonalAccess(req,client);const id=req.nextUrl.searchParams.get('id');return NextResponse.json(await transact(client,async s=>{if(!s.enabledAgents?.includes('projects'))throw Error('Commesse non attivo per questo cliente.');return id?await projectDetail(client,id):{projects:await listProjects(client)};}));}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
export async function POST(req:NextRequest){try{
 if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==req.headers.get('host'))throw Error('Origine non consentita.');
 const b=await req.json();check(b.client);await requirePersonalAccess(req,b.client);const actor=await isSuperuser(req)?'Consulente · superuser demo':'Utente demo';
 return NextResponse.json(await transact(b.client,async s=>{if(!s.enabledAgents?.includes('projects'))throw Error('Commesse non attivo per questo cliente.');if(b.action==='note'){await addProjectNote(b.client,b.id,b.note,actor);return {ok:true};}if(b.action==='save'){const id=await saveProject(b.client,b.fields,actor,b.id,b.version,b.modelId);return {ok:true,id};}throw Error('Operazione non valida.');}));
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
