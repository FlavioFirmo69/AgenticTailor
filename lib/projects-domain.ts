import {money} from './finance-domain.ts';
export const projectStatuses=['Da valutare','Offerta','Attiva','In attesa','Completata','Non acquisita','Annullata'] as const;
export type ProjectStatus=typeof projectStatuses[number];
export type ProjectFields={code:string;title:string;customer:string;owner:string;ownerId?:string|null;status:ProjectStatus;dueDate:string|null;description:string;expectedValue?:string|null};
export type Project=ProjectFields&{id:string;version:number;createdAt:string;updatedAt:string};
export type DiaryEntry={id:string;kind:string;text:string;actor:string;occurredOn:string;createdAt:string};
export function validateProject(value:unknown):ProjectFields{
 if(!value||typeof value!=='object')throw Error('Dati commessa non validi.');
 const b=value as Record<string,unknown>;
 function string(key:string,max:number,required=false){const v=b[key];if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim()))throw Error(`Campo ${key} non valido.`);return v.trim();}
 const code=string('code',32,true).toUpperCase();
 if(!/^[A-Z0-9][A-Z0-9._/-]*$/.test(code))throw Error('Il codice deve contenere lettere, numeri, punti, trattini o barre.');
 if(typeof b.status!=='string'||!projectStatuses.includes(b.status as ProjectStatus))throw Error('Stato non valido.');
 const dueDate=b.dueDate===''||b.dueDate===null?null:b.dueDate;
 if(dueDate!==null){if(typeof dueDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw Error('Scadenza non valida.');const d=new Date(dueDate+'T12:00:00Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==dueDate)throw Error('Scadenza non valida.');}
 const ownerId=b.ownerId||null;if(ownerId!==null&&(typeof ownerId!=='string'||!/^[0-9a-f-]{36}$/i.test(ownerId)))throw Error('Responsabile non valido.');
 const expectedValue=b.expectedValue==null||b.expectedValue===''?null:money(b.expectedValue);if(expectedValue?.startsWith('-'))throw Error('Il valore previsto non può essere negativo.');return {expectedValue,code,ownerId:ownerId as string|null,title:string('title',180,true),customer:string('customer',180),owner:string('owner',120),status:b.status as ProjectStatus,dueDate:dueDate as string|null,description:string('description',6000)};
}
export function validateDiary(value:unknown){
 if(!value||typeof value!=='object')throw Error('Nota non valida.');const b=value as Record<string,unknown>;
 if(typeof b.text!=='string'||!b.text.trim()||b.text.trim().length>6000)throw Error('Inserire una nota tra 1 e 6000 caratteri.');
 if(typeof b.occurredOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.occurredOn))throw Error('Data evento non valida.');
 const d=new Date(b.occurredOn+'T12:00:00Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==b.occurredOn)throw Error('Data evento non valida.');
 return {text:b.text.trim(),occurredOn:b.occurredOn};
}
const activeProjectsRequest=/\b(?:in corso|attiv[ei]|in lavorazione)\b/i;

export function isProjectRequest(text:string){
 if(/\b(?:commess[ae]|incaric(?:o|hi))\b/i.test(text))return true;
 return /\bprogett[oi]\b/i.test(text)&&
  (activeProjectsRequest.test(text)||/\b(?:elenca|mostra|quali|mi dici|miei|vedere|elenco)\b/i.test(text));
}

export function projectListAnswer(text:string,projects:Pick<Project,'code'|'title'|'status'|'dueDate'>[]):string {
 const active=activeProjectsRequest.test(text);
 const matching=active?projects.filter(project=>project.status==='Attiva'):projects;
 if(!matching.length)return active?'Non ci sono commesse in corso in questo ambiente.':'Non ci sono commesse registrate in questo ambiente.';
 const heading=active?'Commesse in corso':'Commesse registrate';
 return heading+'\n'+matching.map(project=>
  project.code+' · '+project.title+' · '+project.status+(project.dueDate?' · Scadenza '+project.dueDate:'')
 ).join('\n');
}
