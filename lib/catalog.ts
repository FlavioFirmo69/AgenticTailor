export const agentCatalog = [
  {id:'finance',name:'Finanze',description:'Conti, saldi e scadenziario di incassi e pagamenti previsti.',ready:true},
  {id:'visits',name:'Sopralluogo',description:'Visite, fotografie e verbali per commessa.',ready:true},
  {id:'calendar',name:'Calendario',description:'Disponibilità, appuntamenti e prenotazioni confermate.',ready:true},
  {id:'projects',name:'Commesse',description:'Schede incarico, stati, scadenze e diario delle variazioni.',ready:true},
  {id:'marketing',name:'Marketing',description:'Strategie e contenuti per promuovere l’attività.',ready:false},
  {id:'planner',name:'Pianificatore',description:'Visione studio, persone e attività dai piani confermati.',ready:true},
  {id:'editor',name:'Redattore',description:'Preparazione e revisione dei contenuti editoriali.',ready:false},
];
export function setAgentActivation(current:string[],id:string,enabled:boolean){
 const agent=agentCatalog.find(a=>a.id===id);
 if(!agent)throw Error('Agente sconosciuto.');
 if(enabled&&!agent.ready)throw Error('Questo agente è ancora da implementare.');
 return enabled?Array.from(new Set([...current,id])):current.filter(a=>a!==id);
}

