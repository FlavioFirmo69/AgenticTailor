'use client';
import {useEffect,useState} from 'react';
import type {ProjectProgress} from '@/lib/projects-domain';

export default function PersonalConsultingPanel({onOpenProject}:{onOpenProject:(id:string)=>void}){
 const [open,setOpen]=useState(false);
 const [projects,setProjects]=useState<ProjectProgress[]|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  async function load(){
   try{
    const response=await fetch('/api/projects?client=personal&view=progress',{signal:controller.signal});
    const result=await response.json();
    if(!response.ok)throw Error(result.error??'Commesse non disponibili.');
    if(!controller.signal.aborted)setProjects(result.projects);
   }catch(error){
    if(!controller.signal.aborted)setError((error as Error).message);
   }
  }
  void load();
  return()=>controller.abort();
 },[open]);
 return <details className="home-agenda home-agenda-collapsible" onToggle={event=>{
  const expanded=event.currentTarget.open;
  if(expanded){setProjects(null);setError('');}
  setOpen(expanded);
 }}>
  <summary><h2>Consulenza e sviluppi</h2><span className="home-agenda-chevron" aria-hidden="true">⌄</span></summary>
  <div className="home-agenda-body">
   {error?<p role="alert">{error}</p>:projects===null?<p role="status">Caricamento commesse…</p>:
    projects.length===0?<p className="home-agenda-empty">Nessuna commessa registrata.</p>:
    <ul className="consulting-home-list">{projects.map(project=><li key={project.id}>
     <button type="button" className="consulting-home-project" onClick={()=>onOpenProject(project.id)}>
      <span>{project.title}</span><small>{project.code} · {project.status}</small>
     </button>
     <div className="consulting-home-progress">
      {project.total>0?<><span>{project.completed}/{project.total} task completati</span>
       <progress value={project.completed} max={project.total} aria-label={'Avanzamento '+project.title}/>
      </>:<span>Nessun task applicabile</span>}
     </div>
    </li>)}</ul>}
  </div>
 </details>;
}
