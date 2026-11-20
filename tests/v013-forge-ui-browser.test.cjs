'use strict';
// Real Chromium UI click-through, not unit-testing markup strings.
// Controlled local fixture only: never touches real saves, Firebase or production.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const original=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(original.includes(boot),'Missing native UI boot anchor');
function forgeFixture(){
 globalThis.__forgeProbe={
  setup(unlocked=1){
   if(!state||!phase1Controller)throw Error('Native account not initialized');
   phase1Controller.state.stage='camp';
   phase1Controller.state.unlocked=unlocked;
   state.run=null;
   state.fragments=5000;
   state.crafting.essence=300;
   const legendary=makeItem(1,'weapon',null,'loot','Sword','Legendary');
   if(legendary?.rarity!=='Legendary')throw Error('Could not make controlled native Legendary');
   state.stash.push(legendary);
   const weapon=state.equip.weapon;
   if(!weapon)throw Error('Native equipped starter missing');
   view='city-center';phase3CityTab='blacksmith';phase3BlacksmithOperation='forge';
   render();
   document.body.classList.remove('v012Preboot');
   document.getElementById('screen')?.removeAttribute('inert');
   document.getElementById('nav')?.removeAttribute('inert');
   return {weaponId:weapon.id,legendaryId:legendary.id,stage:phase1Controller.state.stage};
  },
  unlock(level){
   phase1Controller.state.unlocked=level;
   if(phase5Snapshot?.expedition){
    phase5Snapshot.expedition.completed=level-1;
    phase5Snapshot.expedition.unlocked=level;
    phase5Snapshot.expedition.attempts=level-1;
    phase5Snapshot.expedition.active=null;
    phase5Snapshot.expedition.awardKeys=[];
    phase5Snapshot.expedition.lastOutcome=level>1?'victory':'new';
   }
   phase3RenderCityCenter();
  },
  status(){
   const legendary=state.stash.find(x=>x.rarity==='Legendary');
   return {weaponId:state.equip.weapon.id,weaponTier:state.equip.weapon.tier,
    weaponName:state.equip.weapon.name,legendaryId:legendary?.id,
    legendaryRank:legendary?.upgradeRank||0,fragments:state.fragments,
    essence:state.crafting.essence,operation:phase3BlacksmithOperation,
    phase5Ready,saveBlocked,unlocked:phase1Controller.state.unlocked,
    snapshotUnlocked:phase5Snapshot?.expedition?.unlocked};
  }
 };
}
const html=original.replace(boot,boot+'\n('+forgeFixture.toString()+')();');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.gif':'image/gif','.mjs':'text/javascript'};
const server=http.createServer((req,res)=>{
 const rel=new URL(req.url,'http://local').pathname==='/'?'index.html':decodeURIComponent(new URL(req.url,'http://local').pathname.slice(1));
 const file=path.resolve(root,rel);
 if(rel!=='index.html'&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{
  const data=rel==='index.html'?Buffer.from(html):fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':types[path.extname(rel)]||'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Missing');}
});
test('v0.13 Blacksmith: Tier and Legendary actions visible and executable in Chromium at mobile and desktop sizes',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.WANDERER_BROWSER||process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const out=path.resolve(root,process.env.V013_UI_EVIDENCE_DIR||'reports/v013-forge-ui-evidence');
 fs.mkdirSync(out,{recursive:true});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1',{waitUntil:'load'});
   const initial=await page.evaluate(()=>__forgeProbe.setup());
   assert.equal(initial.stage,'camp');
   assert.equal(await page.getByRole('heading',{name:'City Center'}).count(),1);
   assert.equal(await page.locator('[data-blacksmith-operation="tier-upgrade"]').count(),1,'Tier tab missing in City Center Blacksmith');
   assert.equal(await page.locator('[data-blacksmith-operation="reinforcement"]').count(),1,'Legendary tab missing in City Center Blacksmith');

   await page.locator('[data-blacksmith-operation="tier-upgrade"]').click();
   const tier=page.locator('.v013TierUpgrade');
   assert.equal(await tier.count(),1,'Tier section not displayed in active tab');
   assert.match(await tier.innerText(),/Upgrade existing gear/);
   await page.locator('#v013TierItem').selectOption(initial.weaponId);
   assert.equal(await page.locator('#v013UpgradeTier').isDisabled(),true,'E1 must not upgrade to locked E5');
   await page.screenshot({path:path.join(out,'tier-locked-'+width+'.png'),fullPage:true});

   await page.evaluate(()=>__forgeProbe.unlock(5));
   assert.equal(await page.locator('#v013UpgradeTier').isEnabled(),true,'E5 plus real materials should enable upgrade');
   const before=await page.evaluate(()=>__forgeProbe.status());
   await page.locator('#v013UpgradeTier').click();
   assert.match(await page.locator('dialog[open]').innerText(),/Upgrade existing gear/);
   await page.locator('dialog[open] [data-confirm]').click();
   const after=await page.evaluate(()=>__forgeProbe.status());
   console.log('TIER_CLICK_STATUS '+JSON.stringify({before,after,errors}));
   assert.equal(after.weaponId,before.weaponId,'Tier upgrade must preserve item ID');
   assert.equal(after.weaponTier,5,'Tier upgrade must reach unlocked E5');
   assert(after.fragments<before.fragments&&after.essence<before.essence,'Tier upgrade must spend materials');
   await page.locator('dialog[open] [data-close]').click();
   await page.screenshot({path:path.join(out,'tier-success-'+width+'.png'),fullPage:true});

   await page.locator('[data-blacksmith-operation="reinforcement"]').click();
   assert.equal(await page.getByRole('heading',{name:'Legendary Reinforcement'}).count(),1,'Legendary panel absent');
   assert.equal(await page.locator('#upgradeLegendaryBtn').isEnabled(),true,'Funded Legendary must be reinforceable');
   const beforeRank=await page.evaluate(()=>__forgeProbe.status());
   await page.locator('#upgradeLegendaryBtn').click();
   assert.match(await page.locator('dialog[open]').innerText(),/Reinforce Legendary/);
   await page.locator('dialog[open] [data-confirm]').click();
   const afterRank=await page.evaluate(()=>__forgeProbe.status());
   assert.equal(afterRank.legendaryId,beforeRank.legendaryId,'Reinforcement must preserve Legendary ID');
   assert.equal(afterRank.legendaryRank,1,'Native Legendary reinforcement should increase rank');
   assert(afterRank.fragments<beforeRank.fragments,'Legendary reinforcement must spend fragments');
   assert.equal(await page.getByRole('heading',{name:'Legendary Reinforcement'}).count(),1,'Reinforcement panel must remain active');
   await page.screenshot({path:path.join(out,'legendary-success-'+width+'.png'),fullPage:true});

   assert.deepEqual(errors,[],'No uncaught JS page errors');
   console.log('PASS native Forge UI at '+width+'px: Tier E1→E5 and Legendary +0→+1 via clicked controls');
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});