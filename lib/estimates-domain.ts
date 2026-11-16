import type {ModelPhase} from './workflow-domain';
export type Estimate={type:'fixed'|'percent';value:number};
export function validateEstimate(value:unknown):Estimate{
 if(!value||typeof value!=='object')throw Error('Specificare una stima per ogni task.');
 const e=value as Record<string,unknown>;
 if((e.type!=='fixed'&&e.type!=='percent')||typeof e.value!=='number'||!Number.isFinite(e.value)||e.value<0||e.value>(e.type==='percent'?100:100000)||Math.abs(e.value*100-Math.round(e.value*100))>0.00001)throw Error('Stima non valida: usare valori positivi o zero, con massimo due decimali; le percentuali non possono superare 100.');
 return {type:e.type,value:e.value};
}
export function validateHoursPerDay(value:unknown):number{if(typeof value!=='number'||!Number.isFinite(value)||value<=0||value>24||Math.abs(value*100-Math.round(value*100))>0.00001)throw Error('Le ore per giorno-persona devono essere maggiori di zero e non superiori a 24.');return value;}
export function estimateSummary(phases:ModelPhase[],days:number,hoursPerDay:number){
 if(!Number.isFinite(days)||days<=0)throw Error('Inserire un numero positivo di giorni-persona.');validateHoursPerDay(hoursPerDay);
 const budget=days*hoursPerDay;let fixed=0,percent=0,missing=0;
 const phaseHours=phases.map(p=>p.tasks.reduce((sum,t)=>{if(!t.estimate){missing++;return sum;}const e=validateEstimate(t.estimate);if(e.type==='fixed'){fixed+=e.value;return sum+e.value;}percent+=e.value;return sum+budget*e.value/100;},0));
 const total=phaseHours.reduce((a,b)=>a+b,0);return {budget,fixed,percent,missing,total,balance:budget-total,phaseHours};
}
