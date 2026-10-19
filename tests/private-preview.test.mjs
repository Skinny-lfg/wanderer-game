import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createPrivatePreviewServer} from '../preview/private-server.mjs';

async function start(){
 const root=await mkdtemp(path.join(os.tmpdir(),'wanderer-preview-'));
 await mkdir(path.join(root,'online'));
 await mkdir(path.join(root,'assets'));
 await mkdir(path.join(root,'preview'));
 await writeFile(path.join(root,'index.html'),'<html>Wanderer<script type="module" src="online/app.mjs?v=demo"></script><script type="module" src="online/v012-prototype.mjs"></script></html>');
 await writeFile(path.join(root,'online','v012-prototype.mjs'),'export const testMode = true;');
 await writeFile(path.join(root,'assets','sample.svg'),'<svg xmlns="http://www.w3.org/2000/svg"></svg>');
 await writeFile(path.join(root,'preview','do-not-leak.mjs'),'private internals');
 const server=createPrivatePreviewServer({root,username:'private_owner',password:'test-only-long-password-unique',allowLocalHttp:true});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 return {server,root,base:'http://127.0.0.1:'+server.address().port,async close(){await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}};
}
const request=(base,route,opts={})=>fetch(base+route,{redirect:'manual',...opts});

test('private preview protects HTML, assets, JS and prevents access to repo internals',async()=>{
 const env=await start();try{
  for(const name of ['/','/index.html','/online/v012-prototype.mjs','/assets/sample.svg','/preview/do-not-leak.mjs']){
   const r=await request(env.base,name);assert.equal(r.status,303);
   assert.equal(r.headers.get('location'),'/__preview/login');
  }
  const login=await request(env.base,'/__preview/login');
  assert.equal(login.status,200);
  const html=await login.text();
  assert.match(html,/Username/);
  assert.match(html,/Password/);
  assert.ok(!html.includes('test-only-long-password-unique'),'never send configured secret to browser');
  const bad=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Origin':env.base},body:new URLSearchParams({username:'private_owner',password:'incorrect'})});
  assert.equal(bad.status,401);
  const post=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Origin':env.base},body:new URLSearchParams({username:'private_owner',password:'test-only-long-password-unique'})});
  assert.equal(post.status,303);assert.equal(post.headers.get('location'),'/?playtest=v012');
  const cookie=post.headers.get('set-cookie').split(';')[0];assert.match(cookie,/^wanderer_preview_session=[a-f0-9]{64}$/);
  assert.match(post.headers.get('set-cookie'),/HttpOnly/);
  assert.match(post.headers.get('set-cookie'),/SameSite=Strict/);
  const headers={Cookie:cookie};
  const index=await request(env.base,'/?playtest=v012',{headers});
  assert.equal(index.status,200);const source=await index.text();assert.ok(source.includes('v012-prototype.mjs'));
  assert.ok(!source.includes('online/app.mjs'),'no classic production cloud login on private preview');
  assert.equal((await request(env.base,'/online/v012-prototype.mjs',{headers})).status,200);
  assert.equal((await request(env.base,'/assets/sample.svg',{headers})).status,200);
  assert.equal((await request(env.base,'/preview/do-not-leak.mjs',{headers})).status,404);
  assert.equal((await request(env.base,'/package.json',{headers})).status,404);
  assert.equal((await request(env.base,'/docs/secrets.md',{headers})).status,404);
  assert.equal((await request(env.base,'/online/../../preview/do-not-leak.mjs',{headers})).status,404);
  const logout=await request(env.base,'/__preview/logout',{method:'POST',headers});
  assert.equal(logout.status,303);
  assert.equal((await request(env.base,'/online/v012-prototype.mjs',{headers})).status,303);
 }finally{await env.close();}
});

test('reject mismatched login origins and rate-limit wrong passwords',async()=>{
 const env=await start();try{
  const badOrigin=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:'http://evil.example'},body:new URLSearchParams({username:'private_owner',password:'test-only-long-password-unique'})});
  assert.equal(badOrigin.status,403);
  let last;
  for(let i=0;i<13;i++)last=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:'private_owner',password:'wrong'})});
  assert.equal(last.status,429);
 }finally{await env.close();}
});
