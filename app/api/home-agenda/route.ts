import {NextRequest,NextResponse} from 'next/server';import {requireSuperuser} from '@/lib/access';import {agendaCompletions,completeAgenda} from '@/lib/agenda-completion-store';import {transact} from '@/lib/store';
import {expiredNativeAppointment,overdueAllDayAppointments,personalWeek} from '@/lib/home-agenda-domain';
import {moveCalendarEvent} from '@/lib/calendar-move';
import {linkedBookTitles} from '@/lib/publications-store';
export const runtime='nodejs';
function client(value:unknown){if(value!=='personal'||process.env.CLIENT_ID&&process.env.CLIENT_ID!=='personal')throw Error('Ambiente personale richiesto.');}
export async function GET(req:NextRequest){try{await requireSuperuser(req);client(req.nextUrl.searchParams.get('client'));const result=await transact('personal',async s=>{
 const completed=await agendaCompletions();
 const overdue=s.enabledAgents?.includes('calendar')?overdueAllDayAppointments(s.events,new Set(completed.map(e=>e.id)),personalWeek().start):[];
 return {completed,events:s.events,overdue};
 });
 const bookIds=[...new Set(result.events.flatMap(event=>event.bookId?[event.bookId]:[]))];
 return NextResponse.json({...result,bookTitles:await linkedBookTitles(bookIds)},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
export async function POST(req:NextRequest){try{await requireSuperuser(req);if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==req.headers.get('host'))throw Error('Origine non consentita.');const b=await req.json();client(b.client);return NextResponse.json(await transact('personal',async s=>{
 if(b.action!=='reschedule')return completeAgenda(b,s,'Amministratore');
 if(!s.enabledAgents?.includes('calendar'))throw Error('Calendario non attivo.');
 const index=s.events.findIndex(event=>event.id===b.eventKey);
 const event=s.events[index],today=personalWeek().start;
 if(!event?.allDay||!expiredNativeAppointment(event,today)||event.start!==b.expectedStart||event.end!==b.expectedEnd||
    (await agendaCompletions()).some(e=>e.id===event.id)||event.completedAt)throw Error('Attività aggiornata: ricarica il riepilogo.');
 if(typeof b.day!=='string'||b.day<today)throw Error('Scegli oggi o una data futura.');
 const moved=moveCalendarEvent(event,b.day,s.events);
 s.events[index]=moved;
 return {ok:true,event:moved};
 }));}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
