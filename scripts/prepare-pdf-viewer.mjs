import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('public/pdfjs',{recursive:true});
for(const file of ['pdf.worker.min.mjs','pdf.renderer.min.mjs'])await copyFile('node_modules/pdfjs-dist/build/'+file,'public/pdfjs/'+file);
for(const dir of ['cmaps','standard_fonts','wasm'])await cp('node_modules/pdfjs-dist/'+dir,'public/pdfjs/'+dir,{recursive:true});
await copyFile('node_modules/pdfjs-dist/LICENSE','public/pdfjs/LICENSE');
