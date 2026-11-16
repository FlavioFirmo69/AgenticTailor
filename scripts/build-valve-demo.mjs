import fs from 'node:fs/promises';import path from 'node:path';
const source=path.resolve('../sigma-dwg/legenda.json');const dwg=JSON.parse(await fs.readFile(source,'utf8'));
const objects=dwg.OBJECTS,owner=x=>x.ownerhandle?.[3]??x.ownerhandle?.[2],round=n=>Number(n.toFixed(5));
const catalog=objects.filter(x=>x.object==='BLOCK_HEADER'&&/valvola/i.test(x.name)).map(block=>{
 const paths=[];const points=[];
 function line(a,b,width){points.push(a,b);paths.push({points:[a,b],width});}
 function arc(cx,cy,r,start,end,width){while(end<=start)end+=Math.PI*2;const steps=Math.max(12,Math.ceil((end-start)*24));const p=Array.from({length:steps+1},(_,i)=>{const a=start+(end-start)*i/steps;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];});points.push(...p);paths.push({points:p,width});}
 const entities=objects.filter(x=>owner(x)===block.handle[2]&&x.entity&&!['BLOCK','ENDBLK'].includes(x.entity));
 for(const e of entities){
  if(e.entity==='LINE')line(e.start.slice(0,2),e.end.slice(0,2));
  else if(e.entity==='ARC')arc(...e.center.slice(0,2),e.radius,e.start_angle,e.end_angle);
  else if(e.entity==='LWPOLYLINE'){
   const p=e.points,closed=Boolean(e.flag&512),segments=closed?p.length:p.length-1;
   for(let i=0;i<segments;i++){const a=p[i],b=p[(i+1)%p.length],bulge=e.bulges?.[i]??0;if(Math.abs(bulge)<1e-9){line(a,b,e.const_width);continue;}const dx=b[0]-a[0],dy=b[1]-a[1],chord=Math.hypot(dx,dy),offset=chord*(1-bulge*bulge)/(4*bulge),cx=(a[0]+b[0])/2-dy/chord*offset,cy=(a[1]+b[1])/2+dx/chord*offset;const start=Math.atan2(a[1]-cy,a[0]-cx),sweep=4*Math.atan(bulge),steps=Math.max(12,Math.ceil(Math.abs(sweep)*24));const pts=Array.from({length:steps+1},(_,j)=>[cx+Math.hypot(a[0]-cx,a[1]-cy)*Math.cos(start+sweep*j/steps),cy+Math.hypot(a[0]-cx,a[1]-cy)*Math.sin(start+sweep*j/steps)]);points.push(...pts);paths.push({points:pts,width:e.const_width});}
  }else throw Error('Entità da supportare: '+e.entity);
 }
 const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
 const scale=Math.min(150/(maxX-minX||1),86/(maxY-minY||1));const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 return {id:block.handle[2].toString(16).toUpperCase(),name:block.name,title:block.name.toLocaleLowerCase('it').replace(/^./,x=>x.toUpperCase()).replace('aquattro','a quattro'),source:'legenda nuova-REV01.dwg',attributesExisting:entities.filter(x=>x.entity==='ATTDEF').length,entityCount:entities.length,paths:paths.map(p=>({d:p.points.map((a,i)=>(i?'L':'M')+round(120+(a[0]-cx)*scale)+' '+round(65-(a[1]-cy)*scale)).join(' '),width:round(p.width?p.width*scale:1.6)}))};
});
if(catalog.length!==13||catalog.some(x=>!x.paths.length||x.paths.some(p=>/NaN|Infinity/.test(p.d))))throw Error('Catalogo non valido.');
await fs.mkdir('app/demo/valvole',{recursive:true});await fs.writeFile('app/demo/valvole/catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log('13 simboli estratti dal DWG Sigma; linee, archi e polilinee convertiti in anteprime 2D. Originale invariato.');
