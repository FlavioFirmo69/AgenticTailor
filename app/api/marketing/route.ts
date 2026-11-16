import {NextRequest,NextResponse} from 'next/server';
import {requireSuperuser} from '@/lib/access';
import {marketingBook,marketingCommand,marketingAgenda} from '@/lib/marketing-store';
export const runtime='nodejs';
async function check(req:NextRequest,client:unknown){await requireSuperuser(req);if(client!=='personal'||process.env.CLIENT_ID&&process.env.CLIENT_ID!=='personal')throw Error('Marketing editoriale riservato al tuo ambiente.');}
export async function GET(req:NextRequest){try{await check(req,req.nextUrl.searchParams.get('client'));const q=req.nextUrl.searchParams;return NextResponse.json(q.get('section')==='agenda'?{activities:await marketingAgenda('personal',q.get('start')??'',q.get('end')??'')}:await marketingBook('personal',q.get('bookId')??''),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
export async function POST(req:NextRequest){try{if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==req.headers.get('host'))throw Error('Origine non consentita.');const b=await req.json();await check(req,b.client);return NextResponse.json(await marketingCommand('personal',b,'local-consultant'));}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
