// Stime iniziali dimostrative, applicate soltanto al modello Sigma ancora privo di stime.
const base='http://127.0.0.1:3000';
const r=await fetch(base+'/api/workflow?client=engineering');const data=await r.json();if(!r.ok)throw Error(data.error);
const model=data.models.find(m=>m.name==='Studio tecnico · 10 fasi');if(!model)throw Error('Modello Studio tecnico non trovato.');
if(model.phases.some(p=>p.tasks.some(t=>t.estimate))){console.log('Il modello contiene già stime: nessun dato sovrascritto.');process.exit(0);}
const f=value=>({type:'fixed',value}),p=value=>({type:'percent',value});
const estimates=[[f(2),f(1)],[f(.5),f(.5)],[f(2),f(1)],[f(1),f(1)],[p(6),p(4)],[p(14),p(12),p(4)],[p(14),p(6)],[p(17),p(8)],[f(4),f(1)],[p(5),f(1),f(1)]];
if(model.phases.length!==estimates.length||model.phases.some((phase,i)=>phase.tasks.length!==estimates[i].length))throw Error('Struttura del modello cambiata: configurare manualmente le stime.');
const saved=await fetch(base+'/api/workflow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client:'engineering',action:'model-estimates',model:{id:model.id,version:model.version,hoursPerDay:8,estimates}})});const result=await saved.json();if(!saved.ok)throw Error(result.error);
console.log('Stime salvate nel modello Studio tecnico, versione '+result.version+'. 16 ore fisse + 90% del totale. Disegno e dimensionamento: 30%. Commesse esistenti invariate.');
