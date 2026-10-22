// Native Phase 3 UI with synthetic profiles only. No combat/balance simulation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){phase1Init();phase1Controller.state.unlocked=5;state.gold=state.fragments=10000;
 const home=makeItem(5,'weapon',null,'loot','Sword','Rare');home.name='Home Spare';state.stash.push(home);state.runes.push(makeRune('might',10));
 globalThis.__camp={homeId:home.id,snapshot:()=>({gold:state.gold,fragments:state.fragments,character:state.characterId,stage:phase1Controller.state.stage,selected:phase1Controller.state.selected,bag:phase3BagItems(),overflow:phase3BagOverflow(),supplies:phase3Supplies,vitals:phase3Vitals(),equip:state.equip,stash:state.stash}),
 prepare:()=>{phase1Begin(1);phase2ChooseInitial('magic');phase2ChooseElement('frost');phase1Controller.state.planeIndex=2;const stats=phase2Stats();phase1Vitals={hp:stats.maxhp*.5,mp:stats.mana*.25,maxmp:stats.mana};
  for(let i=0;i<13;i++){const item=makeItem(5,'belt',null,'loot','Leather','Rare');state.stash.push(item);phase3LootIds.add(item.id);}view='phase1';render();},
 equipHome:()=>equipItem(home.id)};render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture+'const phase3RestoredScroll=null;'));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [320,390,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>{window.setInterval=()=>0;localStorage.setItem('wanderer_browser_proto_v01','UNTOUCHED');});
  await page.route('**/*',route=>{if(route.request().url().startsWith(base))return route.continue();external.push(route.request().url());return route.abort();});
  const snap=()=>page.evaluate(()=>__camp.snapshot());
  const fits=async()=>assert(await page.locator('body').evaluate(n=>n.scrollWidth<=innerWidth+1),'body must not overflow horizontally');
  await page.goto(base+'/?expeditionPhase1=1');
  assert.equal(await page.locator('#nav').evaluate(n=>n.inert),false);assert.match(await page.locator('.version').textContent(),/v0.12.0/);
  for(const name of ['Camp','Inventory','City Center','Shrine'])assert.equal(await page.locator('#nav').getByRole('button',{name,exact:true}).isEnabled(),true);
  assert.equal(await page.locator('.phase3Camp [data-phase1-hero]').count(),0);assert.match(await page.locator('.phase3ExpeditionPanel h2').textContent(),/Expedition 5/);
  assert.equal(await page.locator('.phase3Camp [role="progressbar"]').count(),1);assert.equal(await page.locator('.phase3CampHeroVitals .mana').count(),0);assert.equal(await page.locator('.phase3Camp .paper [data-eqslot]').count(),10);
  const positions=await page.locator('.phase3Camp .paper [data-eqslot]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){const a=positions[i],b=positions[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'Camp slots overlap');}
  await page.selectOption('#phase3Difficulty','1');assert.equal(await page.locator('.phase3Start').first().getAttribute('data-phase1-expedition'),'1');
  if(width<=650)await page.locator('#menuToggle').click();await page.locator('[data-online-action="account"]').click();await page.locator('dialog [data-phase1-hero="knight"]').click();assert.equal((await snap()).character,'knight');
  assert.match(await page.locator('.phase3Camp .model').getAttribute('src'),/knight.webp/);
  await page.locator('[data-phase3-nav="runes"]').click();assert.equal(await page.locator('.runesInventoryOnly').isVisible(),true);assert.equal(await page.locator('.equipmentInventory').isVisible(),false);await page.locator('[data-phase3-nav="phase1"]').click();await fits();
  await page.evaluate(()=>__camp.prepare());let s=await snap();assert.equal(s.bag.length,13);assert.equal(s.overflow,1);assert(await page.locator(".phase3Bag h3").textContent().then(t=>t.includes("12/12")));
  assert.equal(await page.locator('[data-phase3-nav="city-center"]').isDisabled(),true);assert.equal(await page.locator('[data-phase3-nav="forge"]').count(),0);assert.equal(await page.locator('[data-phase3-nav="merchant"]').count(),0);
  await page.locator('[data-phase1-plane]').first().click();assert.equal(await page.locator('#phase2EnterRealm').isDisabled(),true);
  assert.equal(await page.locator('.phase3BetweenHero .phase3PotionSlot').count(),3);assert.equal((await snap()).supplies.health,s.supplies.health,'render must not change potion stacks');
  assert.equal(await page.locator('.phase3PassiveTooltip').count(),0,'a passive tooltip is unavailable before a Realm reward');await fits();
  const gold=s.gold,fragments=s.fragments,overflowId=s.bag.at(-1).id;
  await page.locator('[data-phase3-loot="'+overflowId+'"]').click();await page.locator('dialog [data-phase3-discard]').click();await page.locator('dialog [data-confirm]').click();
  s=await snap();assert.equal(s.bag.length,12);assert.equal(s.overflow,0);assert.equal(s.gold,gold);assert.equal(s.fragments,fragments);assert.equal(await page.locator('#phase2EnterRealm').isEnabled(),true);
  assert.equal(await page.locator('[data-phase3-nav="equipment"]').isDisabled(),true,'Inventory navigation is locked during an active Expedition');
  const homeId=await page.evaluate(()=>__camp.homeId);assert.equal(await page.locator('[data-item="'+homeId+'"]').count(),0);assert.equal(await page.evaluate(()=>__camp.equipHome()),false);
  const id=s.bag[0].id;await page.locator('.phase3BetweenBag summary').click();await page.locator('[data-phase3-loot="'+id+'"]').click();assert.match(await page.locator('.itemComparison').textContent(),/Evasion Rating/);await page.locator('dialog [data-phase3-equip="belt"]').click();s=await snap();assert.equal(s.equip.belt.id,id);assert.equal(s.bag.length,11);
  await page.locator('#phase2EnterRealm').click();assert.equal((await snap()).stage,'combat');
  const item=(await snap()).bag[0];await page.locator('.combatBagDetails [data-phase3-loot="'+item.id+'"]').click();assert.equal(await page.locator('dialog [data-phase3-discard]').isDisabled(),true);assert.equal(await page.locator('dialog [data-phase3-equip]').isDisabled(),true);await page.locator('dialog [data-close]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'UNTOUCHED');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await fits();
  console.log('PASS Phase 3 '+width+'px: Camp/header/character/Shrine, twelve-slot bag, discard/overflow, origin guards, compact passives/potions, combat read-only');await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
