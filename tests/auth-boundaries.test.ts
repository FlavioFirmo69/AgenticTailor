import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';
test('controlli asincroni di accesso: ogni chiamata nelle API viene attesa',()=>{
 const root=new URL('../app/api/',import.meta.url);let checks=0;
 function inspect(dir:string){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const filename=path.join(dir,entry.name);if(entry.isDirectory())inspect(filename);else if(entry.name.endsWith('.ts')){const source=ts.createSourceFile(filename,fs.readFileSync(filename,'utf8'),ts.ScriptTarget.Latest,true);function visit(node:ts.Node){if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&['requireSuperuser','requirePersonalAccess'].includes(node.expression.text)){checks++;assert.ok(ts.isAwaitExpression(node.parent),'Autorizzazione non attesa in '+filename);}ts.forEachChild(node,visit);}visit(source);}}}
 inspect(decodeURIComponent(root.pathname).replace(/^\/([A-Za-z]:)/,'$1'));assert.ok(checks>=20);
});
