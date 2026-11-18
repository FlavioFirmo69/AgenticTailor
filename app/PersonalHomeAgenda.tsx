'use client';
import {useEffect,useState} from 'react';import type {Event} from '@/lib/domain';
import {personalWeek,agendaDay,remainingWeekDays} from '@/lib/home-agenda-domain';
type Props={events:Event[];calendarEnabled:boolean;projectsEnabled:boolean;onOpen:()=>void};
const sourceLabels={task:'Task commessa',project:'Commessa',case:'Pratica','second-brain':'Calendario storico',marketing:'Marketing'};
const dateLabel=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('it-IT',{timeZone:'Europe/Rome',weekday:'long',day:'numeric',month:'long'});
export default function PersonalHomeAgenda({events,calendarEnabled,projectsEnabled,onOpen}:Props){
 const [clock,setClock]=useState(()=>new Date()),[refresh,setRefresh]=useState(0),[linked,setLinked]=useState<Event[]>([]),[loading,setLoading]=useState(true),[loaded,setLoaded]=useState(false),[warnings,setWarnings]=useState<string[]>([]);
 const [native,setNative]=useState<Event[]|null>(null),[overdue,setOverdue]=useState<Event[]>([]);
 const [schedule,setSchedule]=useState<{event:Event;day:string}|null>(null);
 const [closed,setClosed]=useState<Set<string>>(new Set()),[canComplete,setCanComplete]=useState(false),[busy,setBusy]=useState(false),[actionError,setActionError]=useState(''),[feedback,setFeedback]=useState(''),[undo,setUndo]=useState<{id:string;version:number}|null>(null);
 const {start,end}=personalWeek(clock);
 useEffect(()=>{const tick=setInterval(()=>setClock(new Date()),60000);const focus=()=>{setClock(new Date());setRefresh(n=>n+1);};window.addEventListener('focus',focus);return()=>{clearInterval(tick);window.removeEventListener('focus',focus);};},[]);
 useEffect(()=>{if(!calendarEnabled){setLoading(false);setLinked([]);return;}const c=new AbortController();setLoading(true);setWarnings([]);setCanComplete(false);
 async function read(url:string){const r=await fetch(url,{signal:c.signal});const d=await r.json();if(!r.ok)throw Error(d.error??'Dati non disponibili.');return d;}
 const range='&start='+start+'&end='+end,notices:string[]=[];
 const sources=[{name:'Appuntamenti e calendario storico',load:async()=>{const d=await read('/api/personal?client=personal&section=calendar'+range);if(d.status!=='connected')notices.push(d.error??d.message??'Calendario storico non disponibile.');return d.events as Event[];}},...(projectsEnabled?[{name:'Task assegnati a te',load:async()=>{const d=await read('/api/my-tasks?client=personal'+range);return d.events as Event[];}}]:[]),{name:'Attività marketing',load:async()=>{const d=await read('/api/marketing?client=personal&section=agenda'+range);return d.activities.map((a:{id:string;date:string;title:string;channel:string})=>{const exclusive=new Date(a.date+'T12:00:00Z');exclusive.setUTCDate(exclusive.getUTCDate()+1);return {id:'marketing:'+a.id,title:a.channel+' · '+a.title,start:a.date+'T00:00:00',end:exclusive.toISOString().slice(0,10)+'T00:00:00',allDay:true,blocking:false,source:'marketing' as const};}) as Event[];}},{name:'Stato delle attività',load:async()=>{const d=await read('/api/home-agenda?client=personal');if(!c.signal.aborted){setNative(d.events);setOverdue(d.overdue);setClosed(new Set(d.completed.map((a:{id:string})=>a.id)));setCanComplete(true);}return [] as Event[];}}];
 void Promise.allSettled(sources.map(s=>s.load())).then(results=>{if(c.signal.aborted)return;const items:Event[]=[],errors:string[]=[...notices];results.forEach((r,i)=>{if(r.status==='fulfilled')items.push(...r.value);else errors.push(sources[i].name+': '+r.reason.message);});setLinked(items);setWarnings(errors);setLoading(false);setLoaded(true);});return()=>c.abort();
 },[start,end,refresh,calendarEnabled,projectsEnabled]);
 async function closeActivity(id:string,action:'complete'|'undo',version?:number){if(busy)return;setBusy(true);setActionError('');setFeedback('');try{const r=await fetch('/api/home-agenda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client:'personal',eventKey:id,action,version})});const d=await r.json();if(!r.ok)throw Error(d.error);setClosed(old=>{const next=new Set(old);if(action==='complete')next.add(id);else next.delete(id);return next;});setUndo(action==='complete'&&d.changed?{id,version:d.version}:null);setFeedback(action==='complete'?'Attività completata.':'Chiusura annullata.');setRefresh(n=>n+1);}catch(e){setActionError((e as Error).message);}finally{setBusy(false);}}
 async function reschedule(){
  if(!schedule||busy)return;
  const {event,day}=schedule;
  setBusy(true);setActionError('');setFeedback('');
  try{
   const r=await fetch('/api/home-agenda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    client:'personal',action:'reschedule',eventKey:event.id,expectedStart:event.start,expectedEnd:event.end,day
   })});
   const d=await r.json();
   if(!r.ok)throw Error(d.error);
   setOverdue(old=>old.filter(item=>item.id!==event.id));
   setNative(old=>old?.map(item=>item.id===event.id?d.event:item)??null);
   setSchedule(null);setFeedback('Attività riprogrammata.');setUndo(null);setRefresh(n=>n+1);
  }catch(e){setActionError((e as Error).message);}finally{setBusy(false);}
 }
 const openOverdue=overdue.filter(event=>!closed.has(event.id));
 const all=[...(native??events),...linked].filter(e=>!closed.has(e.id)),today=agendaDay(all,start),rest=remainingWeekDays(start,end).map(day=>({day,items:agendaDay(all,day)})).filter(g=>g.items.length);
 function rows(items:Event[],day:string){return <ul className="home-agenda-list">{items.map(e=><li key={e.id}>{day===start&&<button className="home-agenda-complete" aria-label={'Completa '+e.title} title="Segna come completata" disabled={busy||loading||!canComplete} onClick={()=>void closeActivity(e.id,'complete')}>✓</button>}<span className="home-agenda-time">{e.blocking===false?'Attività':e.allDay?'Tutto il giorno':e.start.slice(0,10)<day?'In corso':e.start.slice(11,16)}</span><div><b>{e.title}</b><small>{e.source?sourceLabels[e.source]:'Appuntamento'}{!e.allDay&&e.endKnown!==false&&e.end.slice(0,10)===e.start.slice(0,10)?' · fino alle '+e.end.slice(11,16):''}{!e.allDay&&e.endKnown===false?' · durata non indicata':''}</small></div></li>)}</ul>;}
 return <details className="home-agenda home-agenda-collapsible" aria-label="La tua settimana"><summary><h2>La tua settimana</h2><span className="home-agenda-summary-count" aria-live="polite">{!calendarEnabled?'Calendario disattivato':!loaded&&loading?'Caricamento…':today.length+' '+'attività oggi'+(openOverdue.length?' · '+openOverdue.length+' da recuperare':'')+(warnings.length?' · dati parziali':'')}</span><span className="home-agenda-chevron" aria-hidden="true">⌄</span></summary><div className="home-agenda-body"><div className="home-agenda-actions"><button disabled={loading||busy||!calendarEnabled} onClick={()=>{setClock(new Date());setRefresh(n=>n+1);}}>Aggiorna</button><button className="primary" disabled={!calendarEnabled} onClick={onOpen}>Apri agenda</button></div>{!calendarEnabled?<p>Attiva l’agente Calendario per vedere appuntamenti e attività.</p>:<><p className="description">Da oggi a domenica {new Date(end+'T12:00:00Z').toLocaleDateString('it-IT',{timeZone:'Europe/Rome',day:'numeric',month:'long'})} · Europe/Rome</p>{actionError&&<p role="alert" className="home-agenda-warning">{actionError}</p>}{feedback&&<div className="home-agenda-feedback"><span role="status">{feedback}</span>{undo&&<button disabled={busy} onClick={()=>void closeActivity(undo.id,'undo',undo.version)}>Annulla chiusura</button>}</div>}{warnings.length>0&&<div role="alert" className="home-agenda-warning"><b>Il riepilogo è parziale.</b>{warnings.map(w=><p key={w}>{w}</p>)}</div>}{!loaded&&loading?<p role="status">Caricamento della tua agenda…</p>:<div className="home-agenda-columns"><section aria-label="Attività di oggi"><div className="home-agenda-heading"><h3>Oggi</h3><span>{today.length}</span></div><p className="home-agenda-date">{dateLabel(start)}</p>{today.length?rows(today,start):<p className="home-agenda-empty">{warnings.length?'Nessuna attività tra le fonti disponibili.':'Nessuna attività aperta in calendario oggi.'}</p>}</section><section aria-label="Attività del resto della settimana"><div className="home-agenda-heading"><h3>Resto della settimana</h3><span>{rest.reduce((n,g)=>n+g.items.length,0)}</span></div>{rest.length?rest.map(g=><div className="home-agenda-day" key={g.day}><h4>{dateLabel(g.day)}</h4>{rows(g.items,g.day)}</div>):<p className="home-agenda-empty">{start===end?'La settimana termina oggi.':warnings.length?'Nessuna altra attività tra le fonti disponibili.':'Nessuna altra attività aperta in calendario fino a domenica.'}</p>}</section></div>}{loaded&&(<section className="home-agenda-overdue" aria-labelledby="home-agenda-overdue">
 <div className="home-agenda-heading"><h3 id="home-agenda-overdue">Da recuperare</h3><span>{openOverdue.length}</span></div>
 {openOverdue.length===0?<p className="home-agenda-empty">{canComplete?'Nessun evento a tutto il giorno da recuperare.':'Elenco in attesa di aggiornamento.'}</p>:
 <ul className="home-agenda-list">{openOverdue.map(event=><li key={event.id}>
  <button className="home-agenda-complete" aria-label={'Completa '+event.title} disabled={busy||loading||!canComplete} onClick={()=>void closeActivity(event.id,'complete')}>✓</button>
  <div>
   <b>{event.title}</b><small>Previsto il {dateLabel(event.start.slice(0,10))}</small>
   {schedule?.event.id===event.id?
    <form className="home-agenda-actions" onSubmit={e=>{e.preventDefault();void reschedule();}}>
     <label>Nuova data <input type="date" required min={start} value={schedule.day} disabled={busy} onChange={e=>setSchedule({event,day:e.target.value})}/></label>
     <button className="primary" disabled={busy||loading||!canComplete}>Salva</button>
     <button type="button" disabled={busy} onClick={()=>setSchedule(null)}>Annulla</button>
    </form>:
    <button type="button" className="calendar-task-edit" disabled={busy||loading||!canComplete} onClick={()=>{setActionError('');setSchedule({event,day:start});}}>Riprogramma</button>}
  </div>
 </li>)}</ul>}
</section>)}</>}</div></details>;
}
