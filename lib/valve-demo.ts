export type ValveAttribute={id:string;tag:string;value:string;visible:boolean};
export type ValveSymbol={id:string;name:string;title:string;source:string;paths:{d:string;width:number}[]};
export function validateValveAttributes(attributes:ValveAttribute[]){
 if(attributes.length>40)throw Error('Sono consentiti al massimo 40 attributi nel demo.');const tags=new Set<string>();
 const data=attributes.map(a=>{const tag=a.tag.trim().toUpperCase();if(!/^[A-Z][A-Z0-9_]{0,39}$/.test(tag))throw Error('Usa tag con lettere, numeri e underscore, iniziando con una lettera.');if(tags.has(tag))throw Error('Tag duplicato: '+tag);tags.add(tag);if(a.value.length>400)throw Error('Valore troppo lungo: '+tag);return {tag,value:a.value.trim(),visible:a.visible};});
 if(!data.some(a=>a.tag==='CODICE'&&a.value))throw Error('Compila CODICE per identificare il componente.');return data;
}
export function valveSvg(symbol:ValveSymbol,attributes:ReturnType<typeof validateValveAttributes>){
 const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
 const labels=attributes.filter(a=>a.visible&&a.value);const height=150+labels.length*22;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 ${height}"><title>${escape(symbol.title)}</title><desc>Anteprima 2D dalla libreria Sigma, conformità UNI non verificata. Non è un DWG.</desc><g transform="translate(120 5)" fill="none" stroke="#173655" stroke-linecap="round" stroke-linejoin="round">${symbol.paths.map(p=>`<path d="${p.d}" stroke-width="${p.width}"/>`).join('')}</g>${labels.map((a,i)=>`<text x="240" y="${150+i*22}" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="#173655">${escape(a.tag+': '+a.value)}</text>`).join('')}</svg>`;
}
