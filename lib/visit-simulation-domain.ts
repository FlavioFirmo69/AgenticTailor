import {createHash} from 'node:crypto';
export function hash(value:string){return createHash('sha256').update(value).digest('hex');}
export function visitSourceHash(visit:Record<string,unknown>,photos:{id:string;caption:string;generated:boolean}[]){return hash(JSON.stringify({fields:['title','date','place','participants','purpose','observations','decisions','actions'].map(k=>visit[k]),photos:photos.map(p=>[p.id,p.caption,p.generated]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))}));}
export function simulationLanguage(markdown:string):'it'|'es'{
 const text=markdown.normalize('NFKC').toLocaleLowerCase('it').replace(/^[#*\s-]+/,'').replace(/[.!\s]+$/,'').trim();
 if(!text)return 'it';
 if(['scrivi il verbale in spagnolo','scrivi in spagnolo','tutti i verbali in spagnolo','scrivi tutti i verbali in spagnolo','redigi il verbale in spagnolo'].includes(text))return 'es';
 throw Error('Questa istruzione non ha una simulazione preparata. Per il confronto usa “Scrivi il verbale in spagnolo.” oppure lascia vuoto per lo standard. Per altre istruzioni torna in chat.');
}
