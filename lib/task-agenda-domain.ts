export function taskAgendaEvent(task:{id:string;title:string;projectId:string;projectCode:string;projectTitle?:string;dueDate:string|null;plannedStart:string|null;plannedEnd:string|null}){
 const start=task.plannedStart??task.dueDate,end=task.plannedStart?(task.plannedEnd??task.plannedStart):task.dueDate;if(!start||!end)return null;
 const exclusive=new Date(end+'T12:00:00Z');exclusive.setUTCDate(exclusive.getUTCDate()+1);
 return {id:'task:'+task.id,title:'['+task.projectCode+'] '+task.title,start:start+'T00:00:00',end:exclusive.toISOString().slice(0,10)+'T00:00:00',allDay:true,source:'task' as const,endKnown:true,blocking:false,taskId:task.id,projectId:task.projectId,...(task.projectTitle?{referenceTitle:task.projectTitle}:{})};
}
