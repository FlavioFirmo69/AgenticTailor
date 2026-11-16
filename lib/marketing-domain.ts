export type MarketingItem={key:string;date:string;channel:string;title:string;body:string};
export type MarketingPlan={summary:string;items:MarketingItem[]};
export function marketingDate(v:unknown):asserts v is string{
 if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Data marketing non valida.');
}
function text(v:unknown,max:number,label:string){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(label+' non valido.');return v.trim();}
export function validateMarketingDraft(input:Record<string,unknown>){
 marketingDate(input.effectiveOn);const style=text(input.styleMarkdown,30000,'Markdown di stile'),reason=text(input.reason,4000,'Motivo');
 const p=input.plan as Record<string,unknown>;if(!p||!Array.isArray(p.items)||p.items.length>150)throw Error('Piano marketing non valido.');
 const keys=new Set<string>();const items=p.items.map(raw=>{if(!raw||typeof raw!=='object')throw Error('Attività non valida.');const x=raw as Record<string,unknown>;marketingDate(x.date);if(x.date<input.effectiveOn!)throw Error('Attività precedente alla decorrenza della revisione.');const key=text(x.key,120,'Chiave attività');if(keys.has(key))throw Error('Attività duplicata.');keys.add(key);return {key,date:x.date,channel:text(x.channel,100,'Canale'),title:text(x.title,250,'Titolo'),body:text(x.body,16000,'Testo')};});
 return {effectiveOn:input.effectiveOn,styleMarkdown:style,reason,plan:{summary:text(p.summary,45000,'Strategia'),items} as MarketingPlan};
}
export type ScheduledMarketing={id:string;date:string;state:string};
export function revisionImpact(existing:ScheduledMarketing[],plan:MarketingPlan,effectiveOn:string){
 marketingDate(effectiveOn);return {cancel:existing.filter(x=>x.date>=effectiveOn&&['todo','ready'].includes(x.state)).map(x=>x.id),preserve:existing.filter(x=>x.date<effectiveOn||!['todo','ready'].includes(x.state)).map(x=>x.id),create:plan.items.length};
}
