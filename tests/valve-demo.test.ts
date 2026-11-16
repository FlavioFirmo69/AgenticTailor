import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {validateValveAttributes,valveSvg} from '../lib/valve-demo.ts';
test('demo valvole: attributi univoci e codice obbligatorio, XML escapato',()=>{
 const attrs=[{id:'a',tag:'codice',value:'V001',visible:true},{id:'b',tag:'NOTE',value:'<script>&"test',visible:true}];
 assert.equal(validateValveAttributes(attrs)[0].tag,'CODICE');assert.throws(()=>validateValveAttributes([...attrs,{...attrs[0],id:'c'}]));assert.throws(()=>validateValveAttributes([{...attrs[0],value:''}]));assert.throws(()=>validateValveAttributes([{...attrs[0],tag:'DN diametro'}]));
 const svg=valveSvg({id:'1',name:'VALVOLA',title:'Sfera',source:'test',paths:[{d:'M0 0 L20 20',width:1}]},validateValveAttributes(attrs));assert.ok(svg.includes('&lt;script&gt;&amp;&quot;test'));assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('CODICE: V001'));
});
test('catalogo demo: tredici geometrie sorgenti leggibili, nessuna conformità dedotta',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../app/demo/valvole/catalog.json',import.meta.url),'utf8'));assert.equal(catalog.length,13);assert.equal(new Set(catalog.map((s:{id:string})=>s.id)).size,13);for(const s of catalog){assert.ok(s.paths.length);assert.equal(s.source,'legenda nuova-REV01.dwg');assert.equal(s.attributesExisting,0);for(const p of s.paths){assert.ok(!/NaN|Infinity/.test(p.d));assert.ok(p.width>0);}}
});
