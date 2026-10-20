import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {createPrivatePreviewServer} from '../preview/private-server.mjs';

async function start(){
 const root=await mkdtemp(path.join(os.tmpdir(),'wanderer-preview-'));
 await mkdir(path.join(root,'online'));
 await mkdir(path.join(root,'assets'));
 await mkdir(path.join(root,'preview'));
 await writeFile(path.join(root,'index.html'),'<html>Wanderer<script id="onlineAccountLoader">loadAccount()</script><script id="v012PrototypeLoader">loadPrototype()</script><script id="integratedGame">startExpedition()</script><script type="module" src="online/app.mjs?v=demo"></script><script type="module" src="online/v012-prototype.mjs"></script></html>');
 await writeFile(path.join(root,'online','v012-prototype.mjs'),'export const testMode = true;');
 await writeFile(path.join(root,'assets','sample.svg'),'<svg xmlns="http://www.w3.org/2000/svg"></svg>');
 await writeFile(path.join(root,'preview','do-not-leak.mjs'),'private internals');
 const server=createPrivatePreviewServer({root,username:'private_owner',password:'test-only-long-password-unique',allowLocalHttp:true});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 return {server,root,base:'http://127.0.0.1:'+server.address().port,async close(){await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}};
}
const request=(base,route,opts={})=>fetch(base+route,{redirect:'manual',...opts});
async function formWithCsrf(base,username,password){
 const response=await request(base,'/__preview/login');
 const html=await response.text();
 const csrf=html.match(/name="_csrf" value="([a-f0-9]{48})"/)?.[1];
 assert.ok(csrf,'login form must have a one-use CSRF token');
 return new URLSearchParams({username,password,_csrf:csrf});
}

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
  const bad=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Origin':env.base},body:await formWithCsrf(env.base,'private_owner','incorrect')});
  assert.equal(bad.status,401);
  const post=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Origin':env.base},body:await formWithCsrf(env.base,'private_owner','test-only-long-password-unique')});
  assert.equal(post.status,303);assert.equal(post.headers.get('location'),'/?expeditionPhase1=1&expeditionSave=1');
  const cookie=post.headers.get('set-cookie').split(';')[0];assert.match(cookie,/^wanderer_preview_session=[a-f0-9]{64}$/);
  assert.match(post.headers.get('set-cookie'),/HttpOnly/);
  assert.match(post.headers.get('set-cookie'),/SameSite=Strict/);
  const headers={Cookie:cookie};
  const index=await request(env.base,'/?expeditionPhase1=1&expeditionSave=1',{headers});
  assert.equal(index.status,200);const source=await index.text();assert.ok(source.includes('Wanderer'));
  assert.ok(!source.includes('v012-prototype.mjs'));
  assert.ok(!source.includes('loadAccount()'));assert.ok(!source.includes('loadPrototype()'));
  assert.ok(source.includes('startExpedition()'),'preserve integrated game runtime');
  const inlineGame=[...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
   .find(([,attributes,code])=>!/\bsrc\s*=/.test(attributes)&&code.includes('startExpedition()'));
  assert.ok(inlineGame,'integrated runtime must remain in the served page');
  const hash=createHash('sha256').update(inlineGame[2],'utf8').digest('base64');
  const csp=index.headers.get('content-security-policy')||'';
  const scriptDirective=csp.split(';').find(x=>x.trim().startsWith('script-src'))||'';
  assert.ok(scriptDirective.includes("'sha256-"+hash+"'"),'CSP must allow the exact integrated inline game script');
  assert.ok(!scriptDirective.includes("'unsafe-inline'"),'do not loosen script CSP globally');
  for(const route of ['/','/index.html','/?playtest=v012','/?expeditionPhase1=1']){
   const redirect=await request(env.base,route,{headers});
   assert.equal(redirect.status,303);assert.equal(redirect.headers.get('location'),'/?expeditionPhase1=1&expeditionSave=1');
  }
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

test('login CSRF works with varying Origins and rate-limits bad passwords',async()=>{
 const env=await start();try{
  const badOrigin=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:'http://evil.example'},body:await formWithCsrf(env.base,'private_owner','test-only-long-password-unique')});
  assert.equal(badOrigin.status,303,'valid CSRF works regardless of forwarded Origin');
  let last;
  for(let i=0;i<13;i++)last=await request(env.base,'/__preview/login',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:await formWithCsrf(env.base,'private_owner','wrong')});
  assert.equal(last.status,429);
 }finally{await env.close();}
});

test('Railway proxy origin uses configured public origin but still blocks foreign origins',async()=>{
 const env=await start(),previous=process.env.PREVIEW_PUBLIC_ORIGIN;
 process.env.PREVIEW_PUBLIC_ORIGIN='https://preview.example.test';
 try{
  const credentials=await formWithCsrf(env.base,'private_owner','test-only-long-password-unique');
  const good=await request(env.base,'/__preview/login',{
   method:'POST',
   headers:{Origin:'https://preview.example.test','Content-Type':'application/x-www-form-urlencoded','X-Forwarded-Proto':'https'},
   body:credentials
  });
  assert.equal(good.status,303,'must accept public Origin even if upstream Host is localhost');
  const bad=await request(env.base,'/__preview/login',{
   method:'POST',
   headers:{Origin:'https://unknown.example.test','Content-Type':'application/x-www-form-urlencoded','X-Forwarded-Proto':'https'},
   body:await formWithCsrf(env.base,'private_owner','test-only-long-password-unique')
  });
  assert.equal(bad.status,303,'valid token permits nonstandard browser Origin');
 }finally{
  if(previous===undefined)delete process.env.PREVIEW_PUBLIC_ORIGIN;else process.env.PREVIEW_PUBLIC_ORIGIN=previous;
  await env.close();
 }
});

test('login requires a fresh one-use token even if Origin is null',async()=>{
 const env=await start();try{
  const noToken=await request(env.base,'/__preview/login',{method:'POST',body:new URLSearchParams({username:'private_owner',password:'test-only-long-password-unique'})});
  assert.equal(noToken.status,403,'blind form post cannot authenticate');
  const credentials=await formWithCsrf(env.base,'private_owner','test-only-long-password-unique');
  const success=await request(env.base,'/__preview/login',{method:'POST',headers:{Origin:'null','X-Forwarded-Proto':'https'},body:credentials});
  assert.equal(success.status,303,'browser Origin null must not block valid token');
  const replay=await request(env.base,'/__preview/login',{method:'POST',body:credentials});
  assert.equal(replay.status,403,'one-use tokens cannot be replayed');
 }finally{await env.close();}
});
