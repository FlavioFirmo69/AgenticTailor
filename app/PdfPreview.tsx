'use client';
import {useEffect,useRef,useState} from 'react';
import type {PDFDocumentProxy,RenderTask} from 'pdfjs-dist';
export default function PdfPreview({url,title}:{url:string;title:string}){
 const canvas=useRef<HTMLCanvasElement>(null),render=useRef<RenderTask|null>(null);
 const [pdf,setPdf]=useState<PDFDocumentProxy|null>(null),[page,setPage]=useState(1),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;let task:ReturnType<typeof import('pdfjs-dist').getDocument>|undefined;setPdf(null);setPage(1);setError('');setLoading(true);
 (async()=>{const lib=await import('pdfjs-dist');if(!live)return;lib.GlobalWorkerOptions.workerSrc='/pdfjs/pdf.worker.min.mjs';lib.GlobalWorkerOptions.rendererSrc='/pdfjs/pdf.renderer.min.mjs';task=lib.getDocument({url,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/'});const doc=await task.promise;if(live)setPdf(doc);})().catch(e=>{if(live){setError('Anteprima non disponibile: '+e.message);setLoading(false);}});
 return()=>{live=false;render.current?.cancel();void task?.destroy();};},[url]);
 useEffect(()=>{if(!pdf)return;let live=true;let active:RenderTask|undefined;setLoading(true);setError('');(async()=>{const p=await pdf.getPage(page);if(!live||!canvas.current)return;const el=canvas.current;const width=Math.max(240,el.parentElement?.clientWidth??600);const viewport=p.getViewport({scale:Math.min(2,width/p.getViewport({scale:1}).width)});const ratio=Math.min(window.devicePixelRatio||1,2);el.width=Math.floor(viewport.width*ratio);el.height=Math.floor(viewport.height*ratio);el.style.width='100%';el.style.height='auto';active=p.render({canvas:el,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});render.current=active;await active.promise;if(live)setLoading(false);})().catch(e=>{if(live&&e.name!=='RenderingCancelledException'){setError('Anteprima non disponibile: '+e.message);setLoading(false);}});return()=>{live=false;active?.cancel();};},[pdf,page]);
 return <section className="pdf-preview" aria-label={'Anteprima '+title}><div className="pdf-preview-controls"><button disabled={!pdf||page===1||loading} onClick={()=>setPage(p=>p-1)}>←</button><span>Pagina {page} di {pdf?.numPages??'…'}</span><button disabled={!pdf||page>=pdf.numPages||loading} onClick={()=>setPage(p=>p+1)}>→</button></div>{loading&&<p role="status">Caricamento anteprima…</p>}{error&&<p role="alert">{error}. Il download resta disponibile.</p>}<canvas ref={canvas} role="img" aria-label={title+' · pagina '+page}/></section>;
}

