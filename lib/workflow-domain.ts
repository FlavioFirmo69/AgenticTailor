import type {PhaseDeclaration} from './phase-domain';
export const taskStatuses=['Da fare','In corso','In attesa','Completato','Non applicabile'] as const;
export type TeamMember={id:string;name:string;email:string;role:string;active:boolean;version:number;demo:boolean};
export type ModelPhase={title:string;tasks:{title:string;role:string;required:boolean;estimate?:{type:'fixed'|'percent';value:number}}[]};
export type WorkflowModel={id:string;name:string;version:number;description:string;phases:ModelPhase[];hoursPerDay:number};
export type WorkTask={id:string;title:string;phaseId?:string;assigneeId:string|null;expectedRole:string;required:boolean;status:typeof taskStatuses[number];dueDate:string|null;note:string;version:number;estimate?:{type:'fixed'|'percent';value:number}|null};
export type WorkPhase=PhaseDeclaration&{position:number;tasks:WorkTask[]};
export function validateMember(b:Record<string,unknown>){
 if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>160||typeof b.role!=='string'||!b.role.trim()||b.role.length>120||typeof b.email!=='string'||b.email.length>254||typeof b.active!=='boolean')throw Error('Anagrafica non valida.');
 if(b.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))throw Error('Email non valida.');
 return {name:b.name.trim(),role:b.role.trim(),email:b.email.trim(),active:b.active};
}
export function validateTask(b:Record<string,unknown>,allowUnassignedCompleted=false){
 if(!taskStatuses.includes(b.status as WorkTask['status'])||typeof b.note!=='string'||b.note.length>3000)throw Error('Stato o nota non validi.');
 if(b.status==='Non applicabile'&&!b.note.trim())throw Error('Indicare il motivo per cui il task non è applicabile.');
 const assigneeId=b.assigneeId||null;if(assigneeId!==null&&(typeof assigneeId!=='string'||!/^[0-9a-f-]{36}$/i.test(assigneeId)))throw Error('Assegnatario non valido.');
 if((b.status==='In corso'||b.status==='Completato'&&!allowUnassignedCompleted)&&!assigneeId)throw Error('Assegnare una persona prima di avviare o completare il task.');
 const dueDate=b.dueDate||null;if(dueDate!==null){if(typeof dueDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw Error('Scadenza non valida.');const d=new Date(dueDate+'T12:00:00Z');if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==dueDate)throw Error('Scadenza non valida.');}
 if(b.title!==undefined&&(typeof b.title!=='string'||!b.title.trim()||b.title.trim().length>500))throw Error('Titolo task non valido.');return {title:typeof b.title==='string'?b.title.trim():undefined,status:b.status as WorkTask['status'],note:b.note.trim(),assigneeId:assigneeId as string|null,dueDate:dueDate as string|null};
}
