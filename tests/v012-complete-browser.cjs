// Isolated functional UI fixture; forced Wave completion, no combat simulation or real-save IO.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){phase1Init();globalThis.__complete={
 snapshot:()=>({game:phase1Controller.state,build:phase1Build,extra:phase6Run,bag:phase3BagItems(),overflow:phase3BagOverflow(),stock:state.consumables,selection:state.potionSelection,gold:state.gold,fragments:state.fragments,runes:state.runes,pending:state.pendingRuneReward,run:state.run?{status:state.run.status,enc:state.run.enc,waves:state.run.planeWaves,boss:state.run.enemy.boss,style:state.run.enemy.bossStyle}:null,result:phase5Results}),
 fund:()=>{state.gold=state.fragments=10000;phase5Persist();},
 casts:()=>{const r=state.run;for(let i=0;i<3;i++){r.combatSeconds+=3;phase1Build.runtime.lastSpellAt=-999;phase2MagicTick(r);}},
 win:()=>{state.run.enemy.hp=0;phase1WaveWon();},discard:()=>phase3DiscardLoot(phase3BagItems().at(-1)?.id),
 stored:()=>JSON.parse(localStorage.getItem(WandererGame.validationStatus().key))};render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{window.setInterval=()=>0;localStorage.setItem('wanderer_browser_proto_v01','UNTOUCHED');const t=window.setTimeout;window.setTimeout=(f,ms,...a)=>t(f,ms===650?5:ms,...a);});await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const ready=()=>page.waitForFunction(()=>WandererGame.validationStatus().ready),snap=()=>page.evaluate(()=>__complete.snapshot());
 await page.goto(base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=complete');await ready();await page.evaluate(()=>__complete.fund());
 const other=await context.newPage();await other.goto(base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=complete');await other.waitForFunction(()=>WandererGame.validationStatus().blocked);assert.equal(await other.evaluate(()=>WandererGame.validationStatus().ready),false);await other.close();
 await page.locator('[data-phase3-nav="apothecary"]').click();await page.locator('[data-potion-buy]').first().click();await page.locator('[data-potion-buy]').first().click();await page.locator('#potionReroll').click();await page.locator('[data-potion-buy]').first().click();
 await page.locator('[data-phase3-nav="phase1"]').click();await page.locator('[data-potion-load="health"]').click();await page.locator('[data-potion-load="health"]').click();await page.locator('[data-potion-load="mana"]').click();assert.equal((await snap()).selection.length,3);
 const before=await snap();await page.locator('[data-phase1-expedition="1"]').click();await page.locator('#initialBack').click();assert.equal((await snap()).gold,before.gold);assert.deepEqual((await snap()).selection,before.selection);
 await page.locator('[data-phase1-expedition="1"]').click();await page.locator('[data-phase2-initial="magic"]').click();await page.locator('#initialBack').click();assert.deepEqual((await snap()).stock,before.stock);
 await page.locator('[data-phase1-expedition="1"]').click();await page.locator('[data-phase2-initial="magic"]').click();await page.locator('[data-phase2-element="lightning"]').click();assert.equal((await snap()).run.status,'fight');await page.evaluate(()=>__complete.casts());assert.equal((await snap()).build.runtime.staticCharges,3);
 const eventIds=[];
 async function resolveRealm(){
  let s=await snap();if(s.extra.event){if(eventIds.length===0){const original=s.extra.event;await page.reload();await ready();await page.locator('#phase4Resume').click();assert.deepEqual((await snap()).extra.event,original);s=await snap();}eventIds.push(s.extra.event.id);const gold=s.gold;await page.locator('[data-event-choice="2"]').click();assert.equal((await snap()).gold,gold);}else{
   while((await snap()).run?.status==='fight'){await page.evaluate(()=>__complete.win());if(!(await snap()).run)break;await page.waitForFunction(()=>__complete.snapshot().run?.status==='fight');}
  }
  s=await snap();if(s.game.stage!=='finished'){await page.locator('dialog [data-popup-passive]').first().click();assert(await page.locator('#phase5ExitResult').isVisible());assert.equal((await snap()).result.review,'realm');}
 }
 await resolveRealm();assert.equal((await snap()).build.runtime.staticCharges,3);await page.reload();await ready();assert.equal((await snap()).build.runtime.staticCharges,3);await page.locator('#phase5ExitResult').click();
 const slots=await page.locator('.phase3PreparationLayout .paper [data-eqslot]').evaluateAll(nodes=>nodes.map(n=>({slot:n.dataset.eqslot,x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y})));assert.equal(slots.length,10);assert.equal(new Set(slots.map(n=>Math.round(n.x))).size,2);for(const side of [slots.filter(n=>['weapon','offhand','helm','armor','gloves'].includes(n.slot)),slots.filter(n=>['amulet','belt','ring1','ring2','boots'].includes(n.slot))])assert.equal(new Set(side.map(n=>Math.round(n.x))).size,1);
 // Global balance must update every card and survive a refresh.
 for(let i=0;i<3;i++)await page.locator('[data-phase2-reroll="'+i+'"]').click();assert.equal((await snap()).game.rerolls,0);await page.reload();await ready();assert.equal((await snap()).game.rerolls,0);for(const button of await page.locator('[data-phase2-reroll]').all())assert(await button.isDisabled());
 await page.locator('[data-potion-use="2"]').click();assert.equal((await snap()).extra.potions[2].used,true);
 for(let realm=2;realm<=15;realm++){
  while((await snap()).overflow>0)assert(await page.evaluate(()=>__complete.discard()));
  if(realm===15){assert.equal(await page.locator('[data-phase1-plane]').count(),1);assert.equal(await page.locator('[data-phase2-reroll]').count(),0);const boss=(await snap()).game.bossId;await page.reload();await ready();assert.equal((await snap()).game.bossId,boss);}
  await page.locator('[data-phase1-plane]').first().click();await page.locator('#phase2EnterRealm').click();if(await page.locator('[data-phase2-element="fire"]').count())await page.locator('[data-phase2-element="fire"]').click();
  await resolveRealm();if(realm<15)await page.locator('#phase5ExitResult').click();
 }
 const s=await snap();assert(s.pending);assert.equal(s.pending.tier,1);assert.equal(s.pending.options.length,3);assert(s.pending.options.every(r=>r.progression==='expedition'));assert(eventIds.length===3||eventIds.length===4);assert.equal(new Set(eventIds).size,eventIds.length);
 await page.locator('[data-rune-choice]').first().click();assert.equal((await snap()).runes.length,1);await page.reload();await ready();assert.equal((await snap()).runes.length,1);assert.equal((await snap()).pending,null);await page.locator('#phase5ExitResult').click();assert.match(await page.locator('h1').textContent(),/EXPEDITION COMPLETE/);const final=await snap();assert.equal(final.stock.health,2);assert.equal(final.stock.mana,0);await page.locator('#phase5ExitResult').click();await page.reload();await ready();assert.equal((await snap()).runes.length,1);assert.equal((await snap()).gold,final.gold);assert(await page.locator('body').evaluate(n=>n.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'UNTOUCHED');await context.close();console.log('PASS complete Expedition '+width+'px: shops, three potions, Back, Static/checkpoint, events, passive popup, global rerolls and guaranteed E1 Rune');
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
