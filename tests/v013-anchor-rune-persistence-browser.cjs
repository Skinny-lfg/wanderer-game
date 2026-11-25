'use strict';
// Actual Chromium restart with a disposable persistent browser profile and local-only preview.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const prefix='Isolated automatic RPG preview: ',out=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
 assert(out.startsWith(prefix));const root=path.resolve(out.slice(prefix.length)),entry=path.join(root,'index.html');
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'wanderer-anchor-browser-'));
 let html=fs.readFileSync(entry,'utf8');assert(html.includes('const PHASE5_VALIDATION=true;'));
 // Exercise normal playtest storage rather than the special validation slot.
 html=html.replace('const PHASE5_VALIDATION=true;','const PHASE5_VALIDATION=false;');
 const boot='phase1Init();\nconst phase3RestoredScroll';
 assert.equal(html.split(boot).length,2);
 html=html.replace(boot,`phase1Init();
 globalThis.__runeQA={
  award(){if(state.runes.length)throw Error('Fixture already populated');const r=offerBossRunes(1,'blood');if(!equipRune(r.id,0))throw Error('Native Shrine rejected');return r.id;},
  snapshot(){return {runes:JSON.parse(JSON.stringify(state.runes)),slots:[...state.runeSlots],ready:phase5Ready,blocked:saveBlocked};},
  recycle(id){return salvageRune(id);}
 };
 const phase3RestoredScroll`);
 fs.writeFileSync(entry,html);
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1)));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(err,bytes)=>{if(err)return res.writeHead(404).end();res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 let context;const errors=[];
 async function bootBrowser(){
  const options={headless:true};if(process.env.CHROMIUM_PATH)options.executablePath=process.env.CHROMIUM_PATH;
  context=await chromium.launchPersistentContext(profile,options);
  const page=context.pages()[0]||await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>globalThis.__runeQA?.snapshot().ready);
  return page;
 }
 try{
  let page=await bootBrowser();const initial=await page.evaluate(()=>__runeQA.snapshot());assert.equal(initial.runes.length,0);
  const id=await page.evaluate(()=>__runeQA.award()),before=await page.evaluate(()=>__runeQA.snapshot());
  assert.equal(before.runes.length,1);assert.equal(before.slots[0],id);
  assert(await page.evaluate(()=>!!localStorage.getItem('wanderer_v013_c2_clean_sheet_local_preview')));
  await context.close();context=null;
  page=await bootBrowser();const restored=await page.evaluate(()=>__runeQA.snapshot());assert.deepEqual(restored.runes,before.runes);assert.deepEqual(restored.slots,before.slots);
  assert(!restored.blocked);assert.equal(await page.locator('#runeRewardDialog').count(),0);
  assert.deepEqual(errors,[]);console.log('Anchor Rune persisted through Chromium process restart: '+id);
 }finally{if(context)await context.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(profile,{recursive:true,force:true});fs.rmSync(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
