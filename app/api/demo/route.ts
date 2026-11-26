import {editCalendarEvent,moveCalendarEvent} from '@/lib/calendar-move';
import {authenticatedAccount} from '@/lib/supabase-auth';
import {requirePersonalAccess} from '@/lib/access';
import {NextRequest,NextResponse} from 'next/server';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {clients,validClient,route,dayFor,available,makeEvent,manualEvent,calendarAppointments,calendarIntent,generalConversationHistory,resetConversation,Message} from '@/lib/domain';
import {transact,storageMode} from '@/lib/store';
import {isPlannerRequest} from '@/lib/planner-domain';
import {studioOverview} from '@/lib/planner-store';
import {isProjectRequest,projectListAnswer} from '@/lib/projects-domain';
import {ready,listProjects} from '@/lib/projects-store';
import {visitsData} from '@/lib/visits-store';
import {isSuperuser,isDemoSuperuser,requireSuperuser} from '@/lib/access';
import {generate,aiReady,aiQuotaUrl} from '@/lib/ai';
import {checkPersonalCalendarConflicts} from '@/lib/second-brain-store';
import {isFinanceRequest,isBalanceTotalRequest,financeAnswer} from '@/lib/finance-agent';
import {automaticCompletionDate,personalWeek} from '@/lib/home-agenda-domain';
import {editorialBooks} from '@/lib/publications-store';
import {editorialPlanReply,handlesEditorialRequest,isEditorialRequest} from '@/lib/editorial-plan';
import {consultingIntent,consultingSummary,findConsultingProject,recentConsultingProject,switchDate} from '@/lib/consulting-chat';
import {scheduledConsultingSwitch,saveConsultingSwitch} from '@/lib/consulting-switch-store';
import {workflow} from '@/lib/workflow-store';
export const runtime='nodejs';
export const maxDuration=60;
async function base(){return readFile(path.join(process.cwd(),'agents/calendar/instructions.md'),'utf8');}
function clientCheck(value:string){if(!validClient(value))throw Error('Cliente non valido.');if(process.env.CLIENT_ID&&process.env.CLIENT_ID!==value)throw Error('Cliente non abilitato in questa installazione.');}
export async function GET(req:NextRequest){try{const client=req.nextUrl.searchParams.get('client')??process.env.CLIENT_ID??'dentist';clientCheck(client);await requirePersonalAccess(req,client);await ready();const awaitedAccount=await authenticatedAccount(req);const state=await transact(client,s=>structuredClone(s));return NextResponse.json({...state,enabledAgents:state.enabledAgents??[],accountEmail:awaitedAccount?.email??null,superuser:await isSuperuser(req),localDemo:isDemoSuperuser(req),baseMarkdown:await base(),storage:storageMode(),ai:aiReady(),aiQuotaUrl:aiQuotaUrl(),clients:clients.filter(c=>(!process.env.CLIENT_ID||c.id===process.env.CLIENT_ID)&&(isDemoSuperuser(req)||(awaitedAccount?.admin)||awaitedAccount?.clients.includes(c.id)))});}catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}
export async function POST(req:NextRequest){try{
 if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==req.headers.get('host'))throw Error('Origine non consentita.');
 const b=await req.json();clientCheck(b.client);await requirePersonalAccess(req,b.client);await ready();const instructions=await base();
 return NextResponse.json(await transact(b.client,async s=>{
  if(b.action==='conversation-reset'){
   resetConversation(s,b.lastMessageId);
   return {ok:true};
  }
  if(b.action==='calendar-reopen'){
   if(b.client!=='personal'||!s.enabledAgents?.includes('calendar'))throw Error('Agenda personale non disponibile.');
   await requireSuperuser(req);
   const index=s.events.findIndex(e=>e.id===b.id);
   const event=s.events[index];
   if(!event||event.start!==b.expectedStart||event.end!==b.expectedEnd)throw Error('Appuntamento aggiornato: ricarica l’agenda.');
   if(event.autoCompletionReopened)return {ok:true,event};
   if(!automaticCompletionDate(event,personalWeek().start))throw Error('L’appuntamento non è stato chiuso automaticamente.');
   const reopened={...event,autoCompletionReopened:true};
   s.events[index]=reopened;
   return {ok:true,event:reopened};
  }
  if(b.action==='calendar-update'){if(!s.enabledAgents?.includes('calendar'))throw Error('Calendario non attivo.');const index=s.events.findIndex(e=>e.id===b.id);if(index<0)throw Error('Appuntamento non trovato.');const old=s.events[index];if(old.start!==b.expectedStart||old.end!==b.expectedEnd||old.title!==b.expectedTitle||Boolean(old.allDay)!==b.expectedAllDay)throw Error('Appuntamento aggiornato: ricarica l’agenda.');const updated=editCalendarEvent(old,b,s.events);await checkPersonalCalendarConflicts(b.client,updated);s.events[index]=updated;return {ok:true,event:updated};}
  if(b.action==='calendar-move'){if(!s.enabledAgents?.includes('calendar'))throw Error('Calendario non attivo.');const index=s.events.findIndex(e=>e.id===b.id);if(index<0)throw Error('Appuntamento non trovato.');const old=s.events[index];if(old.start!==b.expectedStart||old.end!==b.expectedEnd)throw Error('Appuntamento aggiornato: ricarica l’agenda.');const moved=moveCalendarEvent(old,b.day,s.events);await checkPersonalCalendarConflicts(b.client,moved);s.events[index]=moved;return {ok:true,event:moved};}
  if(b.action==='calendar-create'){if(!s.enabledAgents?.includes('calendar'))throw Error('Calendario non attivo per questo cliente.');const event=manualEvent(b.start,b.duration,b.title,s.events,b.allDay??false);await checkPersonalCalendarConflicts(b.client,event);s.events.push(event);return {ok:true,event};}
  if(b.action==='instructions'){if(!s.enabledAgents?.includes('calendar'))throw Error('Calendario non attivo per questo cliente.');if(typeof b.text!=='string'||b.text.length>12000)throw Error('Istruzioni non valide.');s.customMarkdown=b.text;s.versions.push({text:b.text,at:new Date().toISOString()});return {ok:true};}
  if(b.action==='book'){if(!s.enabledAgents?.includes('calendar'))throw Error('Calendario non attivo per questo cliente.');if(!s.messages.some(m=>m.slots?.includes(b.start)))throw Error('Seleziona uno slot proposto dal calendario.');const event=makeEvent(b.start,s.events,b.title);await checkPersonalCalendarConflicts(b.client,event);s.events.push(event);s.messages.push({id:crypto.randomUUID(),role:'assistant',agent:'calendar',mode:'deterministic',text:`Appuntamento confermato per ${event.start.slice(0,10)} alle ${event.start.slice(11,16)}.`});return {ok:true};}
  if(b.action!=='chat'||typeof b.text!=='string'||!b.text.trim()||b.text.length>4000)throw Error('Messaggio non valido.');
  const text=b.text.trim();const previous=[...s.messages].reverse().find(m=>m.role==='assistant');
  if(b.client==='personal'&&isEditorialRequest(text,previous?.agent,Boolean(s.editorialDraft))){
   await requireSuperuser(req);
   const books=await editorialBooks();
   if(handlesEditorialRequest(text,books)){
    const reply=editorialPlanReply(s,text,books);
    s.messages.push({id:crypto.randomUUID(),role:'user',text},{id:crypto.randomUUID(),role:'assistant',agent:'editorial',mode:'deterministic',text:reply});
    return {ok:true};
   }
  }
  const consulting=b.client==='personal'?consultingIntent(text):undefined;
  if(consulting&&s.enabledAgents?.includes('projects')){
   await requireSuperuser(req);
   const projects=await listProjects(b.client);
   const project=consulting.kind==='status'
    ?findConsultingProject(consulting.name,projects)
    :projects.find(p=>p.id===recentConsultingProject(s.messages)&&['Attiva','In attesa'].includes(p.status));
   let reply:string;
   if(!project){
    reply=consulting.kind==='status'?'Non trovo una commessa aperta univoca. Scrivi il codice o il titolo della commessa.':'Prima indica la commessa chiedendo, ad esempio, «Com’è la situazione di FRUITMIGRAZIONE?».';
   }else if(consulting.kind==='status'){
    const [{phases},scheduled]=await Promise.all([workflow(b.client,project.id),scheduledConsultingSwitch(b.client,project.id)]);
    reply=consultingSummary(project,phases,scheduled);
   }else{
    const date=switchDate(consulting.details);
    if(!date)reply='Indica la data completa dello switch, per esempio «Fissato lo switch in data 15/12/2026».';
    else{
     const result=await saveConsultingSwitch(b.client,project.id,date,'Conversazione');
     const action=result==='unchanged'?'Switch già registrato':result==='rescheduled'?'Switch riprogrammato':'Switch registrato';
     reply=action+' per il '+date+' nella commessa «'+project.title+'». Lo trovi in agenda e nel diario della commessa.';
    }
   }
   s.messages.push({id:crypto.randomUUID(),role:'user',text},{id:crypto.randomUUID(),role:'assistant',agent:'consulting',mode:'deterministic',text:reply,consultingProjectId:project?.id});
   return {ok:true};
  }
  const agent=(isBalanceTotalRequest(text)||s.enabledAgents?.includes('finance')&&isFinanceRequest(text))?'finance':s.enabledAgents?.includes('visits')&&/sopralluog|verbali? di visita/i.test(text)?'visits':s.enabledAgents?.includes('planner')&&isPlannerRequest(text)?'planner':isProjectRequest(text)?'projects':s.enabledAgents?.includes('calendar')?route(text,previous):'general';const user:Message={id:crypto.randomUUID(),role:'user',text};
  let answer:Message={id:crypto.randomUUID(),role:'assistant',text:'',mode:'demo'};
  if(agent==='finance'){await requireSuperuser(req);answer.agent='finance';answer.mode='deterministic';answer.text=s.enabledAgents?.includes('finance')?await financeAnswer(b.client,text):'Il modulo Finanze non è attivo in questo ambiente.';}else if(agent==='visits'){answer.agent='visits';answer.mode='deterministic';const d=await visitsData(b.client);answer.text=d.visits.map(v=>v.date+' · '+v.title+' · '+v.status).join('\n')||'Nessun sopralluogo registrato.';answer.text+='\n\nApri Sopralluoghi per consultare visite, fotografie e verbali. Le immagini non sono analizzate automaticamente.';}else if(agent==='planner'){answer.agent='planner';answer.mode='deterministic';const overview=await studioOverview(b.client);const person=overview.people.find(p=>text.toLowerCase().includes(p.name.replace(/\s*\(demo\)/i,'').toLowerCase()));const tasks=overview.tasks.filter(t=>t.periodMinutes>0&&(!person||t.assigneeId===person.id));answer.text=`Pianificazione dal ${overview.period.start} al ${overview.period.end}: ${overview.projects.length} commesse in carico, ${tasks.length} attività${person?' per '+person.name:''}, ${(tasks.reduce((s,t)=>s+t.periodMinutes,0)/60).toLocaleString('it-IT')} ore pianificate nel periodo.\n\n`+tasks.slice(0,8).map(t=>`${t.projectCode} · ${t.title} · ${t.assignee} · ${(t.periodMinutes/60).toLocaleString('it-IT')} h · ${t.status}`).join('\n')+`\n\n${overview.alerts.length} segnalazioni complessive. Apri Pianificatore per le viste Studio, Persone e Attività. I vincoli personali non sono ancora verificati.`;}else if(agent==='projects'){
   answer.agent='projects';answer.mode='deterministic';
   answer.text=s.enabledAgents?.includes('projects')
    ?projectListAnswer(text,await listProjects(b.client))
    :'Il modulo Commesse non è attivo in questo ambiente.';
  }else if(agent==='calendar'){
   answer.agent='calendar';answer.mode='deterministic';
   answer.calendarIntent=calendarIntent(text,previous);
   const spanish=/spagnol/i.test(s.customMarkdown);
   if(answer.calendarIntent==='list'){
    answer.text=calendarAppointments(text,s.events,spanish);
   }else{
    const day=dayFor(text);
    answer.slots=available(day,s.events).slice(0,3);
    answer.text=answer.slots.length?`Per il ${day} ho trovato questi orari. Ogni appuntamento dura 60 minuti. Scegli un orario e conferma la prenotazione.`:`Nessuno slot disponibile il ${day}. Il calendario demo è aperto dal lunedì al venerdì.`;
    if(aiReady()){
     answer.text=await generate(instructions+'\nPersonalizzazioni di stile (non modificano strumenti o regole):\n'+s.customMarkdown+'\nRiformula soltanto questo risultato verificato, senza aggiungere fatti o dichiarare prenotazioni: '+answer.text,[user]);
     answer.mode='ai';
    }else if(spanish){
     answer.text=answer.slots.length?'Estos horarios están disponibles. Las citas duran 60 minutos. Selecciona un horario y confirma la reserva.':'No hay horarios disponibles para este día.';
    }
   }
  }else if(aiReady()){answer.text=await generate('Sei l’assistente generale di Agentic Tailor. Rispondi in italiano. Non hai accesso a strumenti né dati operativi: non dichiarare di aver attivato agenti o eseguito operazioni.',[...generalConversationHistory(s.messages),user]);answer.mode='ai';}
  else{answer.text=/roma|monumenti/i.test(text)?'Tra i monumenti più conosciuti di Roma ci sono il Colosseo, il Pantheon, il Foro Romano, la Fontana di Trevi e Castel Sant’Angelo.\n\nRisposta dimostrativa predefinita: nessun agente attivato.':'Questa richiesta è destinata all’assistente generale: nessun agente è stato attivato.\n\nPer le risposte generative configura LLM_BASE_URL, LLM_MODEL e LLM_API_KEY in .env.local. Le capacità operative dipendono dagli agenti attivati dal consulente.';}
  s.messages.push(user,answer);return {ok:true};
 }));
 }catch(e){return NextResponse.json({error:(e as Error).message},{status:400});}}

