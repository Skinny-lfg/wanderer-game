// Synthetic, RAM-only fixture. Native gear/vendor UI; no combat simulation or cloud access.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){
 phase1Init();phase1Controller.state.unlocked=5;phase5Snapshot.expedition.completed=4;phase5Snapshot.expedition.unlocked=5;phase5Snapshot.expedition.attempts=4;phase5Snapshot.expedition.lastOutcome='victory';state.gold=state.fragments=10000;
 const belt=makeItem(5,'belt',null,'forge','Cloth','Rare');state.stash.push(belt);
 globalThis.__gearTest={beltId:belt.id,snapshot:()=>JSON.parse(JSON.stringify(state)),status:()=>({saveBlocked,phase5Ready,phase5Message,validation:PHASE5_VALIDATION,preview:PHASE1_PREVIEW,stage:phase1Controller.state.stage,view}),persisted:()=>{const raw=sessionStorage.getItem('wanderer_v012_local_preview');return raw?JSON.parse(raw):null;},rollBelt:()=>{if(!state.merchant)rollShop();state.merchant.stock=[{...makeItem(5,'belt',null,'merchant','Plate','Rare'),goldPrice:10}];phase3ContentTarget=$('cityServiceContent');try{renderMerchant();}finally{phase3ContentTarget=null;}}};
 render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture+'const phase3RestoredScroll=null;'));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[ext]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [360,390,768,1280,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.setDefaultTimeout(5000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{if(route.request().url().startsWith(base))return route.continue();external.push(route.request().url());return route.abort();});
  await page.goto(base+'/?expeditionPhase1=1');
  await page.locator('[data-phase3-nav="equipment"]').click();
  assert.equal(await page.locator('.paper [data-eqslot]').count(),10);
  assert.equal(await page.locator('#affinityFilter,.equipmentBonuses,.affinityBadge').count(),0);
  const boxes=await page.locator('.paper [data-eqslot]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'equipment slots must not overlap');}
  await page.selectOption('#slotFilter','belt');const id=await page.evaluate(()=>__gearTest.beltId);
  await page.locator('[data-item="'+id+'"]').click();assert.match(await page.locator('dialog.equipmentItemDialog .inspect').innerText(),/E5.*Rare/);assert.match(await page.locator('dialog.equipmentItemDialog .inspect').innerText(),/Cloth/);
  assert.equal(await page.locator('dialog.equipmentItemDialog').count(),1);const popup=page.locator('dialog.equipmentItemDialog'),footer=popup.locator('.modalActions');assert.equal(await popup.locator('.inspectActions').count(),0,'item actions leave the detail body');for(const selector of ['#equipThis','#lockThis','#sellThis','[data-close]'])assert.equal(await footer.locator(selector).count(),1,selector+' stays in the popup footer');await page.locator('dialog.equipmentItemDialog #equipThis').click();assert.equal(await page.evaluate(()=>__gearTest.snapshot().equip.belt.id),id);
  // Equipping intentionally returns to Camp; re-enter Inventory before using its filter.
  await page.locator('[data-phase3-nav="equipment"]').click();
  await page.selectOption('#slotFilter','all');await page.locator('[data-eqslot="belt"]').click();await page.locator('dialog.equipmentItemDialog #unequipThis').click();
  assert.equal(await page.evaluate(()=>__gearTest.snapshot().equip.belt),null);
  const beforeMerchant=await page.evaluate(()=>__gearTest.persisted());assert(beforeMerchant,'isolated save missing before Merchant');assert.equal(beforeMerchant.expedition.unlocked,5);
  await page.locator('[data-phase3-nav="city-center"]').click();await page.locator('[data-city-tab="blacksmith"]').click();
  // Forge image preview selects matching existing gear art (not sword fallback).
  if(width===390||width===1280){
   for(const [slot,type] of [['armor','Cloth'],['helm','Leather'],['boots','Plate']]){
    await page.selectOption('#forgeSlot',slot);
    await page.selectOption('#forgeSubtype',type);
    await page.waitForFunction(()=>{const img=document.querySelector('.forgeGrid img.craftHero');return img?.complete&&img.naturalWidth>0});
    const src=await page.locator('.forgeGrid img.craftHero').getAttribute('src');
    assert(src.includes('/armor_'+type.toLowerCase()+'_'),type+' '+slot+' wrong preview: '+src);
   }
  }
  assert.equal(await page.getByRole('heading',{name:'Affinity Transfer',exact:true}).count(),0);
  await page.selectOption('#forgeSlot','belt');await page.selectOption('#forgeSubtype','Leather');await page.selectOption('#forgeTier','5');
  await page.locator('#craft').click();assert.deepEqual(errors,[]);assert.equal((await page.evaluate(()=>__gearTest.status())).saveBlocked,false,'valid isolated progression must not block saves');assert(await page.locator('dialog [data-close]').count(),'craft confirmation did not open');await page.locator('dialog [data-close]').click();
  assert(await page.evaluate(()=>__gearTest.snapshot().stash.some(i=>i.slot==='belt'&&i.armorType==='Leather'&&i.tier===5)));
  await page.locator('[data-phase3-nav="city-center"]').click();await page.locator('[data-city-tab="blacksmith"]').click();await page.evaluate(()=>__gearTest.rollBelt());
  assert.equal(await page.getByRole('heading',{name:/Sigils/}).count(),0);await page.locator('[data-merchant-category="armor"]').click();await page.locator('[data-buy]').first().click();
  const confirm=page.locator('dialog [data-confirm]');if(await confirm.count())await confirm.click();
  assert(await page.evaluate(()=>__gearTest.snapshot().stash.some(i=>i.slot==='belt'&&i.armorType==='Plate'&&i.source==='merchant')));
  const afterMerchant=await page.evaluate(()=>({status:__gearTest.status(),save:__gearTest.persisted()}));assert.equal(afterMerchant.status.saveBlocked,false,'Merchant actions must not block the isolated save');assert(afterMerchant.save.profile.stash.some(i=>i.slot==='belt'&&i.armorType==='Plate'&&i.source==='merchant'),'bought Merchant item missing from persisted payload');assert(afterMerchant.save.profile.gold<beforeMerchant.profile.gold,'Merchant purchase was not persisted');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS v0.12.0 gear '+width+'px: ten slots, no gear affinities/sets, Belt equip/unequip/craft/buy, E# labels, isolated from cloud');
  await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
