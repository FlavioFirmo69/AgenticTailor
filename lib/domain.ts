export const clients = [
  {id:'personal',name:'Il mio ambiente',subtitle:'Consulenza, sviluppi e scrittura',initials:'IO',color:'#173655'},
  {id:'dentist',name:'Studio dentistico',subtitle:'Cura, appuntamenti e relazione',initials:'SD',color:'#117d72'},
  {id:'engineering',name:'Studio tecnico',subtitle:'Commesse, persone e scadenze',initials:'ST',color:'#526fbc'},
  {id:'writer',name:'Scrittore indipendente',subtitle:'Idee, scrittura e pubblicazioni',initials:'SI',color:'#ad7544'},
];
export type ClientId = 'personal'|'dentist'|'engineering'|'writer';
export type Event = {id:string;title:string;start:string;end:string;allDay?:boolean;source?:'second-brain'|'case'|'project'|'task'|'marketing';endKnown?:boolean;blocking?:boolean;taskId?:string;marketingId?:string;projectId?:string};
export type Message = {id:string;role:'user'|'assistant';text:string;agent?:string;slots?:string[];mode?:string};
export type State = {messages:Message[];events:Event[];customMarkdown:string;versions:{text:string;at:string}[];agentInstructions?:Record<string,{markdown:string;versions:{text:string;at:string}[]}>;enabledAgents?:string[]};
export const emptyState=():State=>({messages:[],events:[],customMarkdown:'',versions:[],enabledAgents:[]});
export function validClient(value:string):value is ClientId{return clients.some(c=>c.id===value);}
export function route(text:string,previous?:Message):'calendar'|'general'{
  if(/\b(calendario|appuntament\w*|disponibil\w*|prenot\w*|slot|impegn\w*|agenda)\b/i.test(text))return 'calendar';
  if(previous?.agent==='calendar'&&/^(s[iì]|ok|va bene|il primo|il secondo|il terzo|domani|oggi|lunedì|martedì|mercoledì|giovedì|venerdì)/i.test(text.trim()))return 'calendar';
  return 'general';
}
export function dayFor(text:string,now=new Date()):string{
  const iso=text.match(/\b(\d{4}-\d{2}-\d{2})\b/);if(iso){const d=new Date(iso[1]+'T12:00:00Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==iso[1])throw Error('Data non valida.');return iso[1];}
  const local=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const date=new Date(local+'T12:00:00Z');if(!/\boggi\b/i.test(text))date.setUTCDate(date.getUTCDate()+1);return date.toISOString().slice(0,10);
}
export function available(day:string,events:Event[]):string[]{
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();if(weekday===0||weekday===6)return [];
  return ['09:00','10:00','11:00','14:00','15:00','16:00'].map(h=>`${day}T${h}:00`).filter(s=>!events.some(e=>e.blocking!==false&&s<e.end&&`${s.slice(0,11)}${String(Number(s.slice(11,13))+1).padStart(2,'0')}:00:00`>e.start));
}
export function makeEvent(start:string,events:Event[],title='Appuntamento'):Event{
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:00:00$/.test(start)||!available(start.slice(0,10),events).includes(start))throw Error('Slot non più disponibile. Cerca nuove disponibilità.');
  return {id:crypto.randomUUID(),title:title.slice(0,150),start,end:`${start.slice(0,11)}${String(Number(start.slice(11,13))+1).padStart(2,'0')}:00:00`};
}
export function manualEvent(start:unknown,duration:unknown,title:unknown,events:Event[],allDay=false):Event{
 if(typeof allDay!=='boolean')throw Error('Opzione tutto il giorno non valida.');
 if(allDay&&typeof start==='string'){start=start.slice(0,10)+'T00:00:00';duration=1440;}
 if(typeof start!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/.test(start)||typeof title!=='string'||!title.trim()||title.length>150||typeof duration!=='number'||!(allDay?duration===1440:[15,30,45,60,90,120,180,240,300,360,420,480,540,600,660,720,1440].includes(duration)))throw Error('Data, orario, durata o titolo non validi.');
 const d=new Date(start+'Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,19)!==start)throw Error('Data o orario non validi.');
 const end=new Date(d.valueOf()+duration*60000).toISOString().slice(0,19);
 if(!allDay&&events.some(e=>e.blocking!==false&&start<e.end&&end>e.start))throw Error('Questo orario si sovrappone a un appuntamento esistente. Scegli un altro orario.');
 return {id:crypto.randomUUID(),title:title.trim(),start,end,allDay};
}


