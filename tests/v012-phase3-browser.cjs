// Development-only full v0.12 Expedition UI/gear test. No network outside local host,
// Firebase accounts, real player saves or production deployment.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';
assert(html.includes(boot),'isolated game bootstrap');
const fixture=String.raw`if(PHASE1_PREVIEW){
 phase1Init();
 // Synthetic test-only loadout: exercises the original 15-Plane battle progression quickly,
 // without altering the game's actual enemy HP, rewards, attack code or balancing.
 state.equip.weapon=makeItem(75,'weapon',null,'loot','Sword','Rare');
 for(const slot of ['helm','armor','gloves','boots','amulet','ring1','ring2'])
  state.equip[slot]=makeItem(75,slot,null,'loot','random','Rare');
 state.equip.offhand=makeItem(75,'offhand',null,'loot','Shield','Rare');
 state.stash.push(makeItem(80,'weapon',null,'loot','Mace','Epic'));
 state.gold=3000;state.fragments=3000;
 globalThis.__phase3Audit={
  snapshot:()=>({stage:phase1Controller.state.stage,index:phase1Controller.state.planeIndex,
   wave:phase1Controller.state.wave,boss:!!phase1Controller.state.selected?.boss,
   unlocked:phase1Controller.state.unlocked,rerolls:phase1Controller.state.rerollsLeft,
   vitals:phase3Vitals(),potions:phase3Supplies?{...phase3Supplies}:null,
   weapon:state.equip.weapon?.subtype||null,active:!!state.run,
   runStatus:state.run?.status||null,enemyName:state.run?.enemy?.name||null}),
  tick:()=>{
   const r=state.run;
   if(r?.status==='fight')for(let k=0;k<1200&&state.run===r&&r.status==='fight';k++)updateFight();
   return {stage:phase1Controller.state.stage,index:phase1Controller.state.planeIndex,
     status:state.run?.status||null,enemyHp:state.run?.enemy?.hp||0};
  },
  injury:()=>{if(!phase3IsBetweenPlanes())return false;
   const p=phase3Vitals();phase1Vitals={hp:Math.max(1,p.hp-75),mp:Math.max(0,p.mp-15),maxmp:p.maxmp};
   renderPhase1();return true;},
  illegalPotion:()=>phase3UsePotion('health'),
  verifyHpSwapCap:()=>{
   if(!phase3IsBetweenPlanes())return null;
   const original=state.equip.armor,high=phase2Stats().maxhp;
   phase1Vitals.hp=high;
   const low=makeItem(1,'armor',null,'loot','Armor','Common');
   state.stash.push(low);equipItem(low.id);
   const clipped=phase1Vitals.hp;
   equipItem(original.id);
   const restored=phase1Vitals.hp;
   phase3Go('phase1');
   return {high,clipped,restored};
  }
 };
 render();
}else{load();if(!state.merchant)rollShop();save();render();}`
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
   assert.equal(await page.locator('.phase3GearTile').count(),9,'nine original equipment slots');
   assert.equal(await page.locator('[data-phase3-potion]').count(),0,'no Camp potion buttons');
   assert.equal(await page.evaluate(()=>__phase3Audit.illegalPotion()),false,'API blocks Camp potions');
   await page.locator('[data-phase3-nav="equipment"]').last().click();
   assert(await page.locator('.equipmentInventory').count(),'classic inventory retained in Camp');
   assert(await page.locator('.equipmentLoadout .slotTile').count()===9,'classic nine-slot loadout');
   await page.locator('#phase3Return').click();
   await page.locator('[data-phase1-expedition="1"]').click();
   assert.equal(await page.locator('.phase1Offer').count(),3);
   assert.equal(await page.locator('[data-phase3-potion]').count(),0,'no first-Plane potions');
   let previousStage=1;
   for(let plane=1;plane<=15;plane++){
    assert.equal(await page.locator('.phase1Offer').count(),3,'three offers at Plane '+plane);
    if(plane===2){
     const swap=await page.evaluate(()=>__phase3Audit.verifyHpSwapCap());
     assert(swap.clipped<swap.high,'lower HP equipment must reduce current HP cap');
     assert.equal(swap.restored,swap.clipped,'stronger gear must not heal lost HP from prior cap');
     assert.equal(await page.evaluate(()=>__phase3Audit.injury()),true,'testing after-wave resource deficit');
     let before=await page.evaluate(()=>__phase3Audit.snapshot());
     assert(before.potions.health===2);
     await page.locator('[data-phase3-potion="health"]').click();
     const recovered=await page.evaluate(()=>__phase3Audit.snapshot());
     assert(recovered.vitals.hp>before.vitals.hp&&recovered.potions.health===1,'between-Plane Health use');
     await page.locator('[data-phase3-nav="equipment"]').last().click();
     assert(await page.locator('.equipmentInventory').count(),'original inventory between Planes');
     await page.locator('[data-item]').first().click();
     await page.locator('#equipThis').click();
     const swapped=await page.evaluate(()=>__phase3Audit.snapshot());
     assert.equal(swapped.weapon,'Mace','actual classic equipItem changes weapon');
     assert(swapped.vitals.hp<=swapped.vitals.maxhp,'equipment swap cannot heal above stat cap');
     await page.locator('#phase3Return').click();
     await page.locator('#phase3Reroll').click();
     await page.locator('#phase3Reroll').click();
     assert.equal(await page.evaluate(()=>__phase3Audit.snapshot().rerolls),0);
     assert.equal(await page.locator('#phase3Reroll').isDisabled(),true);
    }
    if(plane===15){
     assert((await page.locator('.phase1Offer').first().innerText()).includes('Boss'),'Plane 15 advertises boss');
    }
    await page.locator('.phase1Offer').first().click();
    if(await page.locator('[data-phase2-element]').count())await page.locator('[data-phase2-element="fire"]').click();
    assert.equal(await page.locator('[data-phase2-passive]').count(),3,'implemented passive selection');
    await page.locator('[data-phase2-passive]').first().click();
    await page.locator('#heroPortrait').waitFor({timeout:10000});
    assert((await page.locator('#heroPortrait').getAttribute('src')).startsWith('assets/characters/avatars/'));
    assert((await page.locator('#enemyPortrait').getAttribute('src')).startsWith('assets/'),'classic original mob, Elite or Boss art');
    assert.equal(await page.locator('[data-phase3-potion]').count(),0,'no combat potions');
    const initialHeight=await page.locator('#scene').evaluate(n=>n.getBoundingClientRect().height);
    assert(initialHeight>=260,'scene remains legible at '+width+'px; height was '+initialHeight);
    for(let tries=0;tries<180;tries++){
     const data=await page.evaluate(()=>__phase3Audit.tick());
     const liveHeight=await page.evaluate(()=>document.querySelector('#scene')?.getBoundingClientRect().height??null);
     if(liveHeight!==null)assert(Math.abs(liveHeight-initialHeight)<2,'combat arena must not jump in size between Waves at '+width+'px: '+initialHeight+' → '+liveHeight);
     if(data.stage==='finished'||data.stage==='failed'||(data.stage==='choice'&&data.index===plane+1))break;
     await page.waitForTimeout(8);
     if(tries===179)throw Error('Plane '+plane+' failed to finish: '+JSON.stringify(data));
    }
    await page.waitForFunction((expected)=>__phase3Audit.snapshot().stage==='finished'||(__phase3Audit.snapshot().index===expected&&!__phase3Audit.snapshot().active),plane+1,{timeout:15000});
    const next=await page.evaluate(()=>__phase3Audit.snapshot());
    assert.notEqual(next.stage,'failed','no player death '+plane);
    assert.equal(next.index,plane===15?15:plane+1,'progresses exactly one Plane');
    assert(initialHeight>=260,'combat scene has stable size');
    assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+8,'no horizontal overflow '+width);
   }
   assert.equal(await page.evaluate(()=>__phase3Audit.snapshot().stage),'finished');
   assert.equal(await page.evaluate(()=>__phase3Audit.snapshot().unlocked),2,'boss unlocks second Expedition');
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'SAVE_SENTINEL_KEEP');
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_account_browser_fixture')),'ACCOUNT_SENTINEL_KEEP');
   assert(!requests.some(url=>url.includes('/online/app.mjs')),'no cloud account module loaded');
   assert(requests.some(url=>url.includes('/assets/combat-vfx/')),'original attack VFX assets loaded');
   assert.deepEqual(errors,[],'no JS exceptions during full Expedition');
   await context.close();
   console.log('PASS full integrated Expedition on '+width+'px: 15 Planes, potions, gear, route rerolls, original combat and save isolation');
  }
 }finally{await browser.close();server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;server.close()});
