// All accounts/saves below are fixtures. Only loopback HTTP and validation-prefixed storage.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';assert(source.includes(boot));
const fixture=String.raw`if(PHASE1_PREVIEW){
 const query=new URLSearchParams(location.search),binding=query.get('validationSlot')||'local',key=WandererV012Save.key(binding);
 if(query.get('fixture')==='old'&&!localStorage.getItem(key)){
  fresh();state.stash=[];state.equip=makeSlots();state.gold=1234;state.fragments=567;state.maxDungeon=80;state.chosen=80;
  state.characterId='knight';state.materials={iron:17,cloth:6};state.onlineProgress.deepestCleared=79;
  for(const slot of SLOTS){const subtype=slot==='weapon'?'Sword':slot==='offhand'?'Shield':'random';state.equip[slot]=makeItem(80,slot,null,'loot',subtype,'Rare');}
  state.equip.weapon=makeItem(80,'weapon',null,'loot','Sword','Legendary');WandererEconomyV0101.upgradeLegendary(state.equip.weapon);
  state.runes=[makeRune('vitality',80)];state.runeSlots=[state.runes[0].id,null,null];state.stash.push(makeItem(80,'helm',null,'loot','Helm','Epic'));
  const migration=WandererV012Save.migrateLegacy(JSON.stringify(state),{binding,identity:{uid:'fixture-old',projectId:'demo-wanderer',nickname:'old_player'}});
  const store=WandererV012Save.createStore(localStorage,binding);store.load();store.commit(migration.save,migration.archive);
 }
 phase1Init();
 globalThis.__saveAudit={
  snapshot:()=>({stage:phase1Controller.state.stage,plane:phase1Controller.state.planeIndex,wave:phase1Controller.state.wave,
   families:[...phase1Controller.state.families],picks:phase1Build?.picks||[],element:phase1Build?.element||null,
   gold:state.gold,fragments:state.fragments,gear:[...state.stash,...Object.values(state.equip).filter(Boolean),...(state.expeditionOverflow||[])],
   stash:state.stash.length,overflow:state.expeditionOverflow.length,runes:state.runes,materials:state.materials,
   onlineProgress:state.onlineProgress,maxDungeon:state.maxDungeon,unlocked:phase1Controller.state.unlocked,vitals:phase3Vitals(),status:WandererGame.validationStatus()}),
  tick:()=>{const r=state.run;if(r?.status==='fight'){const enemy=r.enemy;for(let i=0;i<3000&&state.run===r&&r.status==='fight'&&r.enemy===enemy;i++)updateFight();}},
  defeat:()=>{if(!state.run)return;state.run.hp=1;state.run.enemy.atk=1e9;state.run.tEnemy=100;updateFight();},
  invalidPlane:()=>{try{phase1Choose('not-offered');return false;}catch{return true;}},
  save,reroll:phase3Reroll,abandon:phase1Abandon,duplicate:phase1WaveWon,
  stored:()=>JSON.parse(localStorage.getItem(key)),
  apiIsolation:()=>{let blocked=0;for(const fn of [()=>WandererGame.switchSave('wanderer_browser_proto_v01',{}),()=>WandererGame.backup('{}','test'),()=>WandererGame.cacheSync('wanderer_account_fake_synced','{}'),()=>WandererGame.compactBackups()])try{fn();}catch{blocked++;}return blocked===4&&WandererGame.raw()===null;}
 };render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const mime={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(source.replace(boot,fixture));return;}
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(e,buf)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(e?'Not found':buf);});
});
const launch=()=>chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
async function prepare(context,base,width){
 await context.addInitScript(()=>{
  if(!localStorage.getItem('wanderer_browser_proto_v01'))localStorage.setItem('wanderer_browser_proto_v01','CLASSIC_UNTOUCHED');
  if(!localStorage.getItem('wanderer_account_fixture'))localStorage.setItem('wanderer_account_fixture','ACCOUNT_UNTOUCHED');
  window.setInterval=()=>0;const nativeTimeout=window.setTimeout;
  window.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===650?5:ms,...args);
 });
 await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
 return context.newPage();
}
async function ready(page,url){await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>globalThis.WandererGame?.validationStatus().ready,{timeout:15000});}
const snapshot=page=>page.evaluate(()=>__saveAudit.snapshot());
async function pick(page,element='fire'){
 await page.locator('[data-phase1-plane]').first().click();
 if(await page.locator('[data-phase2-element]').count())await page.locator('[data-phase2-element="'+element+'"]').click();
 await page.locator('[data-phase2-passive]').first().click();
}
async function wave(page){await page.evaluate(()=>__saveAudit.tick());await page.waitForTimeout(15);}
async function noRealWrites(page){
 assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'CLASSIC_UNTOUCHED');
 assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_account_fixture')),'ACCOUNT_UNTOUCHED');
 assert.equal(await page.evaluate(()=>__saveAudit.apiIsolation()),true);
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 let browser=await launch();
 try{for(const width of [390,1280]){
  let context=await browser.newContext({viewport:{width,height:950}}),page=await prepare(context,base,width);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=old-'+width+'&fixture=old';
  await ready(page,url);let initial=await snapshot(page);
  assert.equal(initial.unlocked,1);assert.equal(initial.maxDungeon,80);assert.deepEqual(initial.materials,{iron:17,cloth:6});
  assert.equal((await page.evaluate(()=>__saveAudit.stored())).identity.nickname,'old_player');
  const originalIds=initial.gear.map(i=>i.id),originalLegendary=initial.gear.find(i=>i.rarity==='Legendary');
  // Single writer: the second tab may read its blocked UI but cannot mutate the validation slot.
  const other=await context.newPage();await other.goto(url,{waitUntil:'domcontentloaded'});
  await other.getByRole('alert').waitFor();assert((await other.getByRole('alert').innerText()).includes('another tab'));
  assert.equal(await other.evaluate(()=>WandererGame.validationStatus().ready),false);await other.close();
  await page.locator('[data-phase1-expedition="1"]').click();assert.equal(await page.evaluate(()=>__saveAudit.invalidPlane()),true);
  await page.evaluate(()=>__saveAudit.reroll());await page.evaluate(()=>__saveAudit.reroll());assert.equal(await page.evaluate(()=>__saveAudit.reroll()),false);
  await pick(page);await wave(page);const earned=await snapshot(page);assert(earned.gold>initial.gold);
  const saved=await page.evaluate(()=>__saveAudit.stored());assert.equal(saved.expedition.awardKeys.length,1);
  await page.evaluate(()=>__saveAudit.duplicate());assert.equal((await snapshot(page)).gold,earned.gold);
  // Close the browser itself; carry only this fixture's browser storage into a fresh process.
  await page.close();const storageState=await context.storageState();await context.close();await browser.close();browser=await launch();
  context=await browser.newContext({storageState,viewport:{width,height:950}});page=await prepare(context,base,width);page.on('pageerror',e=>errors.push(e.message));
  await ready(page,url);let restored=await snapshot(page);
  assert.equal(restored.status.outcome,'interrupted');assert.equal(restored.stage,'camp');assert.equal(restored.gold,earned.gold);assert.equal(restored.fragments,earned.fragments);
  assert.deepEqual(restored.picks,[]);assert.equal(restored.element,null);assert.equal(restored.vitals.hp,restored.vitals.maxhp);
  assert.equal(restored.unlocked,1);assert(originalIds.every(id=>restored.gear.some(i=>i.id===id)));
  assert.deepEqual(restored.gear.find(i=>i.id===originalLegendary.id),originalLegendary);
  await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);assert.equal((await snapshot(page)).gold,earned.gold);
  // Abandonment and real incoming-hit defeat preserve committed gear/currency and do not unlock.
  await page.locator('[data-phase1-expedition="1"]').click();await pick(page);await wave(page);let before=await snapshot(page);
  await page.getByRole('button',{name:'Abandon Expedition',exact:true}).click();await page.locator('dialog [data-confirm]').click();
  let after=await snapshot(page);assert.equal(after.status.outcome,'abandoned');assert.equal(after.gold,before.gold);assert.equal(after.unlocked,1);
  await page.locator('[data-phase1-expedition="1"]').click();await pick(page);before=await snapshot(page);await page.evaluate(()=>__saveAudit.defeat());
  after=await snapshot(page);assert.equal(after.status.outcome,'defeat');assert.equal(after.gold,before.gold);assert.equal(after.gear.length,before.gear.length);
  // Complete all 15 Planes using the real integrated attack engine with the legitimate old-tier fixture.
  await page.locator('[data-phase1-expedition="1"]').click();
  for(let step=0;step<80;step++){
   const s=await snapshot(page);if(s.stage==='finished')break;
   assert(s.families.length<=3);
   if(s.stage==='choice')await pick(page,['fire','frost','lightning'][step%3]);
   else await wave(page);
  }
  after=await snapshot(page);assert.equal(after.stage,'finished');assert.equal(after.unlocked,2);assert.equal(after.status.outcome,'victory');
  await page.waitForTimeout(20);before=await snapshot(page);await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);
  after=await snapshot(page);assert.equal(after.unlocked,2);assert.deepEqual(after.onlineProgress,initial.onlineProgress,'classic ranking history is immutable in Expeditions');assert.equal(after.gold,before.gold);assert.equal(after.fragments,before.fragments);assert.deepEqual(after.picks,[]);
  await noRealWrites(page);assert.deepEqual(errors,[]);await context.close();
  console.log('PASS Phase 5 '+width+'px: fixture migration, writer lock, browser restart, no reward replay, abandonment/defeat, 15 Planes/boss, history/gear preservation');
 }
 // New player: no migration, no inherited resources or unlocks; missing Web Locks and corrupt saves block safely.
 const context=await browser.newContext(),page=await prepare(context,base,1280);
 const freshUrl=base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=new';await ready(page,freshUrl);
 const fresh=await snapshot(page);assert.equal(fresh.gold,0);assert.equal(fresh.fragments,0);assert.equal(fresh.unlocked,1);assert.equal((await page.evaluate(()=>__saveAudit.stored())).migration,null);
 await page.evaluate(()=>{localStorage.setItem(WandererGame.validationStatus().key,'{CORRUPT');});await page.reload();
 await page.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>WandererGame.validationStatus().blocked),true);
 assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_v012_validation_v1_new')),'{CORRUPT');await noRealWrites(page);
 await context.close();console.log('PASS Phase 5 new profile and corruption fail closed; real-save sentinels untouched');
 const quotaContext=await browser.newContext(),quotaPage=await prepare(quotaContext,base,1280);
 await ready(quotaPage,base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=quota');
 const durable=await quotaPage.evaluate(()=>localStorage.getItem(WandererGame.validationStatus().key));
 await quotaPage.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('wanderer_v012_validation_v1_'))throw new DOMException('Fixture disk full','QuotaExceededError');return original.call(this,key,value);};});
 await quotaPage.locator('[data-phase1-hero="ranger"]').click();await quotaPage.getByRole('alert').waitFor();
 assert.equal(await quotaPage.evaluate(()=>localStorage.getItem('wanderer_v012_validation_v1_quota')),durable);
 assert.equal(await quotaPage.locator('#phase5Export').count(),1);await noRealWrites(quotaPage);await quotaContext.close();
 const unsupportedContext=await browser.newContext();await unsupportedContext.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined}));
 const unsupported=await prepare(unsupportedContext,base,1280);await unsupported.goto(base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=unsupported');
 await unsupported.getByRole('alert').waitFor();assert((await unsupported.getByRole('alert').innerText()).includes('Web Locks'));
 assert.equal(await unsupported.evaluate(()=>localStorage.getItem('wanderer_v012_validation_v1_unsupported')),null);await noRealWrites(unsupported);await unsupportedContext.close();
 console.log('PASS Phase 5 quota failure retains durable save and export; unsupported writer locking fails closed');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
