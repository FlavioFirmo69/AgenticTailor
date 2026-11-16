export const visitStatuses=['Pianificato','Svolto','Verbale in bozza','Confermato','Annullato'] as const;
export type VisitFields={title:string;date:string;place:string;participants:string;purpose:string;observations:string;decisions:string;actions:string};
export type Visit=VisitFields&{id:string;projectId:string;status:typeof visitStatuses[number];version:number;report:string;report_generation?:{id:string;mode:string;language:string;customMarkdown:string;instructionVersion:number;createdAt:string}|null};
export type VisitPhoto={id:string;caption:string;generated:boolean};
export function validateVisit(input:unknown):VisitFields{
 const b=input as Record<string,unknown>;if(!b||typeof b!=='object')throw Error('Dati sopralluogo mancanti.');
 const result={} as VisitFields;for(const k of ['title','date','place','participants','purpose','observations','decisions','actions'] as const){if(typeof b[k]!=='string'||(b[k] as string).length>(k==='title'?180:6000))throw Error('Campo non valido: '+k);result[k]=(b[k] as string).trim();}
 if(!result.title)throw Error('Inserire il titolo.');if(!/^\d{4}-\d{2}-\d{2}$/.test(result.date)||!Number.isFinite(Date.parse(result.date))||new Date(result.date).toISOString().slice(0,10)!==result.date)throw Error('Data non valida.');return result;
}
export function composeReport(v:VisitFields,photos:{caption:string;generated:boolean}[]){return [`VERBALE DI SOPRALLUOGO · BOZZA`,v.title,`Data: ${v.date} · Luogo: ${v.place||'Da indicare'}`,`Partecipanti: ${v.participants||'Da indicare'}`,`OBIETTIVO\n${v.purpose||'—'}`,`OSSERVAZIONI DELLA VISITA\n${v.observations||'—'}`,`DECISIONI\n${v.decisions||'—'}`,`AZIONI E QUESTIONI APERTE\n${v.actions||'—'}`,`FOTOGRAFIE (${photos.length})\n${photos.map((p,i)=>`${i+1}. ${p.caption||'Senza didascalia'}${p.generated?' [IMMAGINE DEMO GENERATA]':''}`).join('\n')||'Nessun allegato'}`].join('\n\n');}
export function imageMime(bytes:Uint8Array){if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return 'image/png';if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';throw Error('Usare fotografie JPEG, PNG o WebP.');}

