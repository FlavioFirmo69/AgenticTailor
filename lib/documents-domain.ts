export const documentKinds=['Documento','Disegno','Relazione','Altro'] as const;
export const documentStatuses=['Bozza','Da verificare','Approvato','Consegnato'] as const;
export function documentInput(b:Record<string,unknown>){
 const title=String(b.title??'').trim(),kind=String(b.kind??''),status=String(b.status??''),date=String(b.date??''),note=String(b.note??'').trim();
 if(!title||title.length>180)throw Error('Titolo documento obbligatorio, massimo 180 caratteri.');
 if(!(documentKinds as readonly string[]).includes(kind)||!(documentStatuses as readonly string[]).includes(status))throw Error('Tipo o stato documento non valido.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Data documento non valida.');
 if(note.length>3000)throw Error('Nota troppo lunga.');return {title,kind,status,date,note};
}
export function documentFile(name:string,bytes:Uint8Array){
 if(!bytes.length||bytes.length>8*1024*1024)throw Error('File vuoto o superiore a 8 MB.');
 const filename=name.replace(/[\r\n\\/\x00-\x1f]/g,'_').slice(0,180)||'allegato';const ext=filename.toLowerCase().split('.').at(-1);
 const types:Record<string,string>={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',txt:'text/plain',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',dwg:'application/octet-stream',dxf:'application/octet-stream',zip:'application/zip'};
 const mime=types[ext??''];if(!mime)throw Error('Formato ammesso: PDF, immagini, TXT, DOCX, XLSX, DWG, DXF o ZIP.');
 const head=String.fromCharCode(...bytes.slice(0,12));
 if(ext==='pdf'&&!head.startsWith('%PDF-')||ext==='png'&&![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)||['jpg','jpeg'].includes(ext??'')&&!(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)||ext==='webp'&&!(head.startsWith('RIFF')&&head.slice(8,12)==='WEBP')||['docx','xlsx','zip'].includes(ext??'')&&!head.startsWith('PK'))throw Error('Il contenuto del file non corrisponde al formato indicato.');
 return {filename,mime};
}
