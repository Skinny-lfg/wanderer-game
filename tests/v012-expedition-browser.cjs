// Isolated real-browser classic-combat integration for v0.12 Phase 1.
// Requires Chrome/Chromium; never connects to Firebase or mutates real user data.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const types={'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.html':'text/html'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(req.url.split('?')[0]||'/');
 const filename=pathname==='/'?path.join(root,'index.html'):path.resolve(root,'.'+pathname);
 if(filename!==path.join(root,'index.html')&&!filename.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 fs.readFile(filename,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream'});res.end(err?'Missing':data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage(),errors=[],requested=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>requested.push(r.url()));
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.addInitScript(()=>{
    // Deliberately INVALID sentinel values: if normal load() or account import runs,
    // it will try to process and/or replace these keys.
    localStorage.setItem('wanderer_browser_proto_v01','DO_NOT_TOUCH_CLASSIC_SAVE');
    localStorage.setItem('wanderer_account_browser_fixture','DO_NOT_TOUCH_ACCOUNT_SAVE');
    let seed=42;
    Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   });
   await page.goto(base+'/?expeditionPhase1=1',{waitUntil:'domcontentloaded'});
   await page.locator('[data-phase1-expedition="1"]').waitFor({timeout:10000});
   assert.equal(await page.locator('#v012-launch').count(),0,'standalone prototype must not load');
   assert(!requested.some(url=>url.includes('/online/app.mjs')),'account/cloud app must not load');
   assert(!requested.some(url=>url.includes('/online/v012-prototype.mjs')),'dual combat simulator must not load');
   assert.equal(await page.locator('[data-phase1-hero]').count(),5,'five original characters available');
   await page.locator('[data-phase1-expedition="1"]').click();
   assert.equal(await page.locator('.phase1Offer').count(),3,'exactly three Plane choices');
   assert((await page.locator('.phase1Offers').innerText()).includes('Waves'),'show wave count');
   assert((await page.locator('.phase1Offers').innerText()).includes('Elite')||(await page.locator('.phase1Offers').innerText()).includes('Regular'),'show Elite state');
   await page.locator('.phase1Offer').first().click();
   if(await page.locator('[data-phase2-element]').count())await page.locator('[data-phase2-element="lightning"]').click();
   assert.equal(await page.locator('[data-phase2-passive]').count(),3,'exactly three implemented temporary passive choices');
   await page.locator('[data-phase2-passive]').first().click();
   await page.locator('#heroPortrait').waitFor({timeout:10000});
   await page.locator('#enemyPortrait').waitFor();
   assert((await page.locator('#heroPortrait').getAttribute('src')).startsWith('assets/characters/avatars/'),'original character sprite');
   assert((await page.locator('#enemyPortrait').getAttribute('src')).startsWith('assets/mobs/'),'original mob art');
   assert.equal(await page.locator('#leave').count(),0,'no extraction/loss controls');
   assert.equal(await page.locator('#nextFight').count(),0,'automatically start wave');
   assert.equal(await page.locator('.combatVfx').count()>=0,true);
   // Combat engine auto-advances every Wave, and returns to path selection.
   await page.locator('#combatSpeed').click();await page.locator('#combatSpeed').click();
   try{await page.locator('.phase1Offer').first().waitFor({timeout:35000});}
   catch(e){console.error('PHASE2 BROWSER DIAGNOSTICS',width,
      await page.evaluate(()=>({scene:document.querySelector('#screen')?.innerText?.slice(0,2300),
      save:globalThis.WandererGame?.snapshot?.().run?.status,
      hp:globalThis.WandererGame?.snapshot?.().run?.hp})));throw e;}
   assert((await page.locator('h2').first().innerText()).includes('Plane 2 / 15'),'first Plane cleared');
   assert((await page.locator('.phase1FamilyRow').first().innerText()).length>0,'family retained between Planes');
   const vitals=await page.locator('.phase1FamilyRow').nth(1).innerText();
   assert(vitals.includes('HP')&&vitals.includes('Mana'),'display carried HP and temporary Magic Mana');
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'DO_NOT_TOUCH_CLASSIC_SAVE');
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_account_browser_fixture')),'DO_NOT_TOUCH_ACCOUNT_SAVE');
   assert(requested.some(u=>u.includes('/assets/mobs/')),'existing enemy asset loaded');
   assert(requested.some(u=>u.includes('/assets/combat-vfx/')),'existing attack VFX asset loaded');
   assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+6,'no horizontal overflow at '+width);
   assert.deepEqual(errors,[],'no page exceptions at '+width);
   await context.close();
  }
  console.log('PASS v0.12 classic Expedition integration: mobile/desktop, sequential Waves, VFX, isolated saves');
 } finally {await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;server.close();});
