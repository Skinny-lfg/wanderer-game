'use strict';
// Actual shared inventory and Shrine interaction with persistent local-only Chromium.
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
  seed(){const A=WandererV013AnchorCampaign;let c=A.collection();for(const shard of A.get('blood').shards)c={...c,campaign:A.grantSecuredShard(c.campaign,shard.id)};state.anchorCollection=c;if(!phase5Persist())throw Error('Fixture persistence failed');},
  snapshot(){const A=WandererV013AnchorCampaign,c=state.anchorCollection||A.collection();return {bag:A.bag(c),status:A.status(c.campaign,'blood'),occupied:stashItemCount(),ready:phase5Ready,blocked:saveBlocked};},
  inventory(){phase3Go('equipment');},shrine(){phase3Go('runes');}
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
  let page=await bootBrowser();await page.evaluate(()=>__runeQA.seed());
  const initial=await page.evaluate(()=>__runeQA.snapshot());
  assert.equal(initial.bag.secured.length,3);
  await page.evaluate(()=>__runeQA.inventory());
  assert.equal(await page.locator('.stashGrid [data-shard-item]').count(),3);
  await page.evaluate(()=>__runeQA.shrine());
  assert.equal(await page.locator('[data-anchor-mount="blood_shard_1"]').isEnabled(),true);
  assert.equal(await page.locator('[data-anchor-mount="decay_shard_1"]').isEnabled(),false);
  await page.locator('[data-anchor-mount="blood_shard_2"]').click();
  let current=await page.evaluate(()=>__runeQA.snapshot());
  assert.equal(current.bag.secured.length,2);assert.equal(current.occupied,initial.occupied-1);assert.equal(current.bag.mounted[0].id,'blood_shard_2');
  await context.close();context=null;page=await bootBrowser();await page.evaluate(()=>__runeQA.shrine());
  assert.equal(await page.locator('[data-anchor-unmount="blood_shard_2"]').isEnabled(),true);
  await page.locator('[data-anchor-unmount="blood_shard_2"]').click();
  assert.equal((await page.evaluate(()=>__runeQA.snapshot())).occupied,initial.occupied);
  for(const id of ['blood_shard_3','blood_shard_1','blood_shard_2'])await page.locator('[data-anchor-mount="'+id+'"]').click();
  current=await page.evaluate(()=>__runeQA.snapshot());assert.equal(current.status,'open');assert.equal(current.bag.secured.length,0);assert.equal(current.occupied,initial.occupied-3);
  assert.equal(await page.locator('[data-anchor-unmount="blood_shard_2"]').count(),0);
  assert(await page.locator('.anchorShrinePanel').innerText().then(s=>s.includes('Portal Open')));
  await context.close();context=null;page=await bootBrowser();
  assert.equal((await page.evaluate(()=>__runeQA.snapshot())).status,'open');
  await page.evaluate(()=>__runeQA.inventory());assert.equal(await page.locator('.stashGrid [data-shard-item]').count(),0);
  assert.deepEqual(errors,[]);console.log('SHRINE_BROWSER: shared stash, equip, remove, reload, permanent portal all passed');
 }finally{if(context)await context.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(profile,{recursive:true,force:true});fs.rmSync(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
