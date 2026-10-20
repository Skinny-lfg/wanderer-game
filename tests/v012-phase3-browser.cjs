// Development-only full v0.12 Expedition UI/gear test. No network outside local host,
// Firebase accounts, real player saves or production deployment.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';
assert(html.includes(boot),'isolated game bootstrap');
const fixture=String.raw`if(PHASE1_PREVIEW){
 phase1Init();state.equip.weapon=makeItem(100,'weapon',null,'loot','Sword','Rare');
 state.consumables={health:1};state.potionSelection=['health'];
 globalThis.__phase3Audit={
 snapshot:()=>({stage:phase1Controller.state.stage,weapon:state.equip.weapon?.subtype,bag:phase3BagItems().length,overflow:phase3BagOverflow(),hp:phase3Vitals().hp}),
 finish:()=>{if(state.run)weaponAttack(state.run);while(state.run){state.run.enemy.hp=0;phase1WaveWon();if(state.run&&state.run.status!=='fight')break;}},
 loot:()=>{const item=makeItem(100,'weapon',null,'loot','Mace','Epic');state.stash.push(item);phase3LootIds.add(item.id);renderPhase1();return item.id;},
 injure:()=>{phase1Vitals.hp=phase3Vitals().maxhp/2;renderPhase1();},
 illegal:()=>{const item=makeItem(1,'weapon',null,'loot','Staff','Common');state.stash.push(item);return equipItem(item.id);}
 };render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
assert(fixture.includes('__phase3Audit'));
const pageHtml=html.replace(boot,fixture);
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.html':'text/html'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(req.url.split('?')[0]||'/'),p=pathname==='/'?path.join(root,'index.html'):path.resolve(root,'.'+pathname);
 if(p!==path.join(root,'index.html')&&!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(p,(e,buf)=>{res.writeHead(e?404:200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});res.end(e?'Not found':buf);});
});
async function run(){
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('request',request=>requests.push(request.url()));
   await page.addInitScript(()=>{
    localStorage.setItem('wanderer_browser_proto_v01','SAVE_SENTINEL_KEEP');
    localStorage.setItem('wanderer_account_browser_fixture','ACCOUNT_SENTINEL_KEEP');
    const original=window.setTimeout;
    window.setTimeout=(cb,ms,...args)=>original(cb,ms===650?5:ms,...args);
   });
   await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(u.origin!==base)return route.abort();
    if(u.pathname==='/'&&u.searchParams.get('expeditionPhase1')==='1')
     return route.fulfill({status:200,contentType:'text/html',body:pageHtml});
    return route.continue();
   });
   await page.goto(base+'/?expeditionPhase1=1',{waitUntil:'domcontentloaded'});
   await page.locator('[data-phase1-expedition="1"]').waitFor({timeout:12000});
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('phase3IntegratedPreview')),true,'Phase 3 preview-specific responsive CSS is enabled');
   await page.locator('[data-phase3-nav="equipment"]').click();
   assert.equal(await page.locator('.equipmentLoadout .slotTile').count(),10,'ten slots including Belt');
   assert.equal(await page.locator('.equipmentBonuses').count(),0,'removed sets stay absent');
   await page.locator('#phase3Return').click();await page.locator('[data-phase1-expedition="1"]').click();
   await page.locator('[data-phase2-initial="blood"]').click();
   assert.equal(await page.locator('[data-potion-use]').count(),0,'no combat potions');
   await page.evaluate(()=>__phase3Audit.finish());await page.waitForTimeout(30);
   await page.locator('dialog [data-popup-passive]').first().click();await page.locator('#phase5ExitResult').click();
   assert.equal(await page.locator('.phase3PreparationLayout [data-eqslot]').count(),10);
   assert.equal(await page.evaluate(()=>__phase3Audit.illegal()),false,'global Stash item cannot equip during Expedition');
   const id=await page.evaluate(()=>__phase3Audit.loot());
   const bagBefore=(await page.evaluate(()=>__phase3Audit.snapshot())).bag;await page.locator('[data-phase3-loot="'+id+'"]').click();
   assert((await page.locator('dialog').innerText()).match(/Upgrade|Downgrade|Sidegrade/));
   await page.locator('[data-phase3-equip]').first().click();
   assert.equal((await page.evaluate(()=>__phase3Audit.snapshot())).weapon,'Mace');
   assert.equal((await page.evaluate(()=>__phase3Audit.snapshot())).bag,bagBefore-1,'equipped loot is removed from bag');
   await page.evaluate(()=>__phase3Audit.injure());const hp=(await page.evaluate(()=>__phase3Audit.snapshot())).hp;
   await page.locator('[data-potion-use="0"]').click();assert((await page.evaluate(()=>__phase3Audit.snapshot())).hp>hp);
   for(const nav of ['merchant','apothecary','forge'])assert(await page.locator('[data-phase3-nav="'+nav+'"]').isDisabled());
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'SAVE_SENTINEL_KEEP');
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_account_browser_fixture')),'ACCOUNT_SENTINEL_KEEP');
   assert(!requests.some(url=>url.includes('/online/app.mjs')),'no cloud account module loaded');
   assert(requests.some(url=>url.includes('/assets/combat-vfx/')),'original attack VFX assets loaded');
   assert.deepEqual(errors,[],'no JS exceptions during full Expedition');
   await context.close();
   console.log('PASS preparation '+width+'px: ten slots, native loot equip/comparison, owned potions, Camp restrictions and isolated saves');
  }
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;server.close()});
