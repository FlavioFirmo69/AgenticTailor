import {dayFor,manualEvent,type State} from './domain.ts';
import {personalWeek} from './home-agenda-domain.ts';

export type EditorialBook={id:string;title:string;code:string;previousTitles?:string[]};
type Step={key:string;title:string;date:string};
export type EditorialDraft={book:EditorialBook;steps:Step[];paperbackOnly?:boolean};
const confirmation=/^\s*(?:s[iì][,!]?\s*)?(?:puoi\s+)?(?:generarli|generarle|genera(?:li|le| gli eventi| gli appuntamenti| le attivit[aà]| il piano)?|confermo il piano|crea gli eventi)[.!]?\s*$/i;
const paperbackRequest=/\b(?:solo|soltanto|esclusivamente)\s+(?:in\s+)?cartace[oa]\b/i;
const names=(book:EditorialBook)=>[book.title,book.code,...(book.previousTitles??[])];
const publication=/\b(?:pubblic\w*|piano editoriale|piano del romanzo|uscita)\b/i;
const bookTerms=/\b(?:libro|romanzo|copertina|amazon|kdp|piano editoriale|piano del romanzo)\b/i;
const startPlan=(text:string)=>publication.test(text)&&bookTerms.test(text);
const revision=/^(?:aggiungi|aggiungo|inserisci|devo anche|aggiorna le date|sposta)\b/i;
export const isEditorialRequest=(text:string,previousAgent?:string,hasDraft=false)=>{
 if(/\bstrategi\w*\b/i.test(text))return false;
 return startPlan(text)||previousAgent==='editorial'||(hasDraft&&proofQuantity(text)!==undefined);
};

function businessDays(from:string,count:number){
 const date=new Date(from+'T12:00:00Z');
 while(count>0){
  date.setUTCDate(date.getUTCDate()+1);
  if(date.getUTCDay()!==0&&date.getUTCDay()!==6)count--;
 }
 return date.toISOString().slice(0,10);
}
function milestones(today:string,proofs?:number,paperbackOnly=false,checkKdpBeforeProofs=false,existing?:Step[]):Step[]{
 const cover=existing?.find(step=>step.key==='cover')?.date??businessDays(today,1);
 const preview=existing?.find(step=>step.key==='preview')?.date??businessDays(cover,1);
 const order=checkKdpBeforeProofs?businessDays(preview,1):preview;
 const proofCheck=businessDays(order,10),submit=businessDays(proofs?proofCheck:preview,1);
 return [
  {key:'cover',title:'Approvare la copertina definitiva',date:cover},
  {key:'preview',title:paperbackOnly?'Controllare PDF, copertina e anteprima del cartaceo in KDP':'Controllare file, scheda e anteprima KDP',date:preview},
  ...(proofs?[
   ...(checkKdpBeforeProofs?[{key:'proof-ready',title:'Controllare nella Libreria KDP che il libro consenta di ordinare copie di prova',date:preview}]:[]),
   {key:'order-proof',title:'Ordinare '+proofs+' copie di prova',date:order},
   {key:'check-proof',title:'Verificare le copie di prova prima di inviare il libro',date:proofCheck}
  ]:[]),
  {key:'submit',title:paperbackOnly?'Inviare l’edizione cartacea a KDP per la revisione':'Inviare il libro a KDP per la revisione',date:submit},
  {key:'review',title:'Controllare lo stato nella Libreria KDP',date:businessDays(submit,5)},
  {key:'live',title:'Verificare che il libro sia acquistabile su Amazon.it',date:businessDays(submit,12)}
 ];
}
function normalize(text:string){
 return text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function findBook(text:string,books:EditorialBook[]){
 const input=normalize(text);
 const exact=books.filter(book=>names(book).some(value=>normalize(value)===input));
 if(exact.length)return exact.length===1?exact[0]:undefined;
 const matches=books.filter(book=>names(book).some(value=>{
  const name=normalize(value);
  return name.length>=3&&(' '+input+' ').includes(' '+name+' ');
 }));
 return matches.length===1?matches[0]:undefined;
}
export function handlesEditorialRequest(text:string,books:EditorialBook[]){
 const input=normalize(text);
 return startPlan(text)||confirmation.test(text)||revision.test(text)||proofQuantity(text)!==undefined||books.some(book=>names(book).some(value=>normalize(value)===input));
}
function proofQuantity(text:string){
 const numbers:Record<string,number>={una:1,un:1,due:2,tre:3,quattro:4,cinque:5,sei:6,sette:7,otto:8,nove:9,dieci:10};
 const match=text.toLowerCase().match(/\b(\d+|un[ao]?|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+copi[ae]\s+(?:(?:di|in)\s+)?(?:bozza|prova)\b/);
 return match?numbers[match[1]]??Number(match[1]):undefined;
}
function proposal(draft:EditorialDraft){
 return 'Bozza di pubblicazione · '+draft.book.title+(draft.paperbackOnly?' · solo cartaceo':'')+'\n'+draft.steps.map(step=>step.date+' · '+step.title).join('\n')+
  (draft.steps.some(step=>step.key==='check-proof')?'\nLa verifica delle copie è indicativa: prima dell’invio attendi la consegna e controllale.':'')+
  '\nL’ultima data è una verifica prevista, soggetta ai tempi di KDP. Puoi aggiungere altre attività, scrivere «Sposta [tappa] al AAAA-MM-GG» o confermare con «Generali».';
}

export function editorialPlanReply(state:State,text:string,books:EditorialBook[],now=new Date()):string {
 const today=personalWeek(now).start;
 const draft=state.editorialDraft;
 const selectedPaperback=paperbackRequest.test(text);
 if(selectedPaperback&&startPlan(text))state.editorialPaperbackPending=true;
 if(confirmation.test(text)){
  if(!draft)return 'Non ci sono attività editoriali in bozza da generare.';
  if(!state.enabledAgents?.includes('calendar'))return 'Attiva Calendario per generare le attività in agenda.';
  if(!books.some(book=>book.id===draft.book.id))return 'La scheda del libro non è più disponibile.';
  if(draft.steps.some(step=>step.date<today))return 'Alcune date sono passate. Scrivi «Aggiorna le date» per ricalcolare la bozza.';
  const events=draft.steps.map(step=>({
   ...manualEvent(step.date+'T00:00:00',1440,step.title,[],true),bookId:draft.book.id
  }));
  state.events.push(...events);
  delete state.editorialDraft;
  delete state.editorialPaperbackPending;
  return 'Create '+events.length+' attività in agenda, collegate a «'+draft.book.title+'». Le trovi anche nel Diario del romanzo.';
 }
 const book=findBook(text,books);
 const selected=!startPlan(text)&&draft&&(revision.test(text)||proofQuantity(text)!==undefined)?draft.book:book??(!startPlan(text)&&draft?.book);
 if(!selected)return 'Per quale romanzo? Scrivi il titolo esatto o il codice di una scheda in Scrittura e pubblicazioni.';
 const saved=state.events.filter(event=>event.bookId===selected.id).sort((a,b)=>a.start.localeCompare(b.start));
 if(saved.length)return 'Piano registrato · '+selected.title+'\n'+saved.map(event=>event.start.slice(0,10)+' · '+event.title).join('\n')+'\nPuoi aggiornare le date nell’agenda.';
 const existing=draft?.book.id===selected.id?draft:undefined;
 const paperbackOnly=selectedPaperback||state.editorialPaperbackPending||existing?.paperbackOnly||false;
 delete state.editorialPaperbackPending;
 const quantity=proofQuantity(text);
 if(quantity!==undefined&&(!Number.isSafeInteger(quantity)||quantity<1||quantity>999))return 'Indica quante copie di prova vuoi ordinare, da 1 a 999.';
 let steps=existing?.steps??milestones(today,undefined,paperbackOnly);
 if(quantity!==undefined||(existing&&paperbackOnly&&!existing.paperbackOnly)||/\baggiorna le date\b/i.test(text)){
  const previousQuantity=existing?.steps.find(step=>step.key==='order-proof')?.title.match(/\d+/)?.[0];
  const custom=steps.filter(step=>step.key.startsWith('extra-'));
  const refreshDates=/\baggiorna le date\b/i.test(text);
  const checkKdpBeforeProofs=steps.some(step=>step.key==='proof-ready')||
   (quantity!==undefined&&/\bdopo\b[^\n]*\b(?:kdp|libreria)\b/i.test(text));
  steps=[...milestones(today,quantity??(previousQuantity?Number(previousQuantity):undefined),paperbackOnly,checkKdpBeforeProofs,refreshDates?undefined:existing?.steps),...custom.map(step=>({...step,date:step.date<today?businessDays(today,1):step.date}))];
 }else if(existing){
  const move=text.match(/^sposta\s+(.+?)\s+(?:(?:al|il)\s+)?(\d{4}-\d{2}-\d{2})[.!]?$/i);
  if(move){
   const label=normalize(move[1]);
   const matching=steps.filter(step=>label&&normalize(step.title).includes(label));
   const date=dayFor(move[2],now);
   if(matching.length!==1||date<today)return 'Indica una tappa univoca e una data da oggi in avanti, nel formato AAAA-MM-GG.';
   const revised=steps.map(step=>step.key===matching[0].key?{...step,date}:step);
   const standard=revised.filter(step=>!step.key.startsWith('extra-'));
   if(standard.some((step,index)=>index>0&&step.date<standard[index-1].date))return 'La nuova data invertirebbe due tappe. Mantieni l’ordine indicato nella bozza.';
   steps=revised;
  }
  const extra=text.match(/^\s*(?:aggiungi(?: anche)?|aggiungo|inserisci|devo anche)[:\s]+(.+?)[.!]?\s*$/i);
  if(extra){
   const date=/\b\d{4}-\d{2}-\d{2}\b/.test(extra[1])?dayFor(extra[1],now):steps.find(step=>step.key==='preview')!.date;
   const title=extra[1].replace(/\s+(?:il\s+)?\d{4}-\d{2}-\d{2}\s*$/,'').trim();
   if(!title||title.length>150||date<today)return 'Indica un’attività entro 150 caratteri e una data da oggi in avanti.';
   if(steps.length>=24)return 'La bozza contiene già 24 attività.';
   if(!steps.some(step=>step.title===title&&step.date===date))steps=[...steps,{key:'extra-'+crypto.randomUUID(),title,date}];
  }
 }
 state.editorialDraft={book:selected,paperbackOnly,steps:[...steps].sort((a,b)=>a.date.localeCompare(b.date))};
 return proposal(state.editorialDraft);
}
