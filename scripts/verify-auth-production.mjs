import assert from 'node:assert/strict';const base=process.env.VERIFY_BASE_URL??'http://127.0.0.1:3001';
for(const p of ['/','/admin','/demo/valvole']){const r=await fetch(base+p,{redirect:'manual'});assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),base).pathname,'/login');}
for(const p of ['/api/demo?client=engineering','/api/book-sales?client=personal&section=recent','/api/admin'])assert.equal((await fetch(base+p)).status,401);
assert.equal((await fetch(base+'/login')).status,200);
assert.equal((await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'not-admin@example.com',password:'not-a-password'})})).status,403);
console.log('OK: pagine riservate al login, API anonime negate anche per ambienti demo, login disponibile e CSRF verificato.');
