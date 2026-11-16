const DAY=86400000;
export function dayIndex(value:string){const n=Date.parse(value+'T12:00:00Z')/DAY;if(!Number.isFinite(n))throw Error('Data Gantt non valida.');return Math.floor(n);}
export function isoDay(index:number){return new Date(index*DAY+DAY/2).toISOString().slice(0,10);}
export function ganttRange(start:string,end:string,deadline:string){const first=Math.min(dayIndex(start),dayIndex(deadline));const last=Math.max(dayIndex(end),dayIndex(deadline))+2;return {first,last,count:last-first+1,planEnd:dayIndex(end)-first+1,deadline:dayIndex(deadline)-first+1,coincident:end===deadline};}
export function ganttBar(start:string,end:string,first:number){return {left:dayIndex(start)-first,width:dayIndex(end)-dayIndex(start)+1};}
