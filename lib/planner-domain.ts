import {dayIndex,isoDay} from './gantt-domain.ts';
export type DailyAllocation={date:string;minutes:number};
export function weekStart(date:string){const index=dayIndex(date),dow=new Date(date+'T12:00:00Z').getUTCDay();return isoDay(index-((dow+6)%7));}
export function allocatePlan(tasks:{id:string;minutes:number}[],start:string,hoursPerDay:number){
 const capacity=Math.round(hoursPerDay*60);if(capacity<1||!Number.isFinite(capacity))throw Error('Capacità giornaliera non valida.');let day=dayIndex(start),used=0;const result:Record<string,DailyAllocation[]>={};
 function skip(){while([0,6].includes(new Date(isoDay(day)+'T12:00:00Z').getUTCDay()))day++;}skip();
 for(const task of tasks){let remaining=task.minutes;if(!Number.isInteger(remaining)||remaining<0)throw Error('Impegno del piano non valido.');result[task.id]=[];while(remaining>0){if(used===capacity){day++;used=0;skip();}const amount=Math.min(remaining,capacity-used);result[task.id].push({date:isoDay(day),minutes:amount});used+=amount;remaining-=amount;}}
 return result;
}
export function periodMinutes(days:DailyAllocation[],start:string,end:string){return days.reduce((sum,d)=>sum+(d.date>=start&&d.date<=end?d.minutes:0),0);}
export function isPlannerRequest(text:string){return /pianificator|carico.*studio|attivit[aà].*(studio|settimana|prossim|assegnat|progettist)|chi deve fare|consegne.*(studio|settimana)/i.test(text);}
