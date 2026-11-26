import {NextRequest,NextResponse} from 'next/server';import {requireSuperuser} from '@/lib/access';import {agendaCompletions,completeAgenda} from '@/lib/agenda-completion-store';import {transact} from '@/lib/store';
import {canRescheduleHomeEvent,overdueAllDayAppointments,personalWeek} from '@/lib/home-agenda-domain';
import {moveCalendarEvent} from '@/lib/calendar-move';
import {linkedBookTitles} from '@/lib/publications-store';
import {externalEvent} from '@/lib/second-brain-domain';
import {plannedCaseAppointment,savePersonalCase} from '@/lib/personal-cases-store';
import {checkPersonalCalendarConflicts} from '@/lib/second-brain-store';
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
 const today=personalWeek().start;
 if(typeof b.day!=='string'||b.day<today)throw Error('Scegli oggi o una data futura.');
 if(typeof b.eventKey==='string'&&b.eventKey.startsWith('case:')){
  const row=await plannedCaseAppointment(b.eventKey.slice(5));
  if(!row||row.version!==b.expectedSourceVersion)throw Error('Appuntamento aggiornato: ricarica il riepilogo.');
  const original=externalEvent(row);
  const event={...original,id:b.eventKey,source:'case' as const,sourceVersion:row.version};
  if(!canRescheduleHomeEvent(event,today)||event.start!==b.expectedStart||event.end!==b.expectedEnd||
    (await agendaCompletions()).some(e=>e.id===event.id))throw Error('Appuntamento aggiornato: ricarica il riepilogo.');
  if(b.day===row.date)return {ok:true};
  const moved=moveCalendarEvent({...event,source:undefined},b.day,s.events);
  await checkPersonalCalendarConflicts('personal',moved);
  await savePersonalCase({action:'event',id:row.id,caseId:row.case_id,version:row.version,fields:{
   title:row.title,date:b.day,start:row.start,end:row.end,location:row.location,status:row.status
  }});
  return {ok:true};
 }
 const index=s.events.findIndex(event=>event.id===b.eventKey);
 const event=s.events[index];
 if(!event||!canRescheduleHomeEvent(event,today)||event.start!==b.expectedStart||event.end!==b.expectedEnd||
    (await agendaCompletions()).some(e=>e.id===event.id))throw Error('Attività aggiornata: ricarica il riepilogo.');
 const moved=moveCalendarEvent(event,b.day,s.events);
 await checkPersonalCalendarConflicts('personal',moved);
 s.events[index]=moved;
 return {ok:true,event:moved};
 }));}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
