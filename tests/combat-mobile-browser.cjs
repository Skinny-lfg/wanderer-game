// Real-browser mobile regression: decision-critical risk, loot and odds precede Continue/Extract.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8012';
const boot='load();if(!state.merchant)rollShop();save();render();';
const instrument=String.raw`
globalThis.combatUITest=(enc,status='ready')=>{
 fresh();
 const item={id:'ui-loot-1',name:'Rare Test Boots',slot:'boots',subtype:'Boots',tier:10,rarity:'Rare',effect:null,atk:2};
 state.run={tier:10,path:'temple',status,enc,eliteType:'berserker',hp:100,maxhp:100,mp:0,maxmp:0,barrier:0,
  stats:totalStats(),enemy:null,loot:[item],valuables:[{name:'Coin',worth:12}],gold:40,fragments:20};
 view='combat';renderCombat();
};
`;
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [320,390,650,768,1440]){
   const page=await browser.newPage({viewport:{width,height:840}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/online/app.mjs*',route=>route.fulfill({contentType:'text/javascript',body:'// Browser UI test does not require online auth.'}));
   await page.route(URL+'/',route=>route.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8').replace(boot,instrument+boot)}));
   await page.goto(URL+'/');
   // Offline browser fixture must unlock the UI as the mocked auth would.
   await page.evaluate(()=>{document.getElementById('screen').inert=false;document.getElementById('nav').inert=false;});
   for(const [enc,expectRisk] of [[3,'Berserker Elite'],[4,'The Abyssal Guardian']]){
    await page.evaluate(enc=>combatUITest(enc),enc);
    const mobile=width<=650;
    const decision=page.locator('.combatDecisionPanel');
    assert.equal(await decision.isVisible(),mobile,'mobile decision visibility '+width);
    if(mobile){
     const info=await decision.innerText();
     assert.match(info,new RegExp(expectRisk),'wave '+enc+' risk on '+width);
     const odds=decision.locator('.decisionExtraDetails');
     assert.equal(await odds.count(),1,'drop chances available in expandable details');
     await odds.locator('summary').click();
     const expanded=await decision.innerText();
     assert.match(expanded,/Gear drop/,'drop chance present after expanding odds');
     for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary'])assert.ok(expanded.includes(rarity),rarity+' chance missing');
     assert.match(info,/Run Loot · 1 gear · 1 valuables/,'run loot count present');
     assert.equal(await decision.locator('img').count(),1,'run loot thumbnail present');
     const rect=await page.evaluate(()=>{
      const d=document.querySelector('.combatDecisionPanel').getBoundingClientRect(),
       a=document.querySelector('.combatActions').getBoundingClientRect();
      return {left:d.left,right:d.right,bottom:d.bottom,actionsTop:a.top,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth};
     });
     assert.ok(rect.left>=-1&&rect.right<=rect.viewport+1,'decision panel off screen '+width);
     assert.ok(rect.bottom<=rect.actionsTop+2,'risk and loot must appear before choices '+width);
     assert.equal(await page.locator('.combatExpeditionDetails .nextWaveOdds').isVisible(),false,'redundant large drop odds hidden on mobile');
     assert.equal(await page.locator('.combatExpeditionDetails .combatLoot').isVisible(),false,'redundant lower run loot hidden on mobile');
     assert.ok(rect.bodyWidth<=rect.viewport+2,'horizontal overflow at '+width);
    }else{
     assert.equal(await page.locator('.combatExpeditionDetails .nextWaveOdds').isVisible(),true,'desktop detailed odds remain visible');
     assert.equal(await page.locator('.combatExpeditionDetails .combatLoot').isVisible(),true,'desktop run loot remains visible');
    }
   }
   await page.evaluate(()=>combatUITest(5,'win'));
   assert.equal(await page.locator('#nextFight').count(),0,'completed dungeon cannot continue');
   if(width<=650)assert.match(await page.locator('.combatDecisionPanel').innerText(),/Dungeon cleared/);
   assert.deepEqual(errors,[],'no browser script errors');
   await page.screenshot({path:'/tmp/wanderer-mobile-decision-'+width+'.png',fullPage:true});
   console.log('PASS '+width+'px: visible elite/boss, all drop odds, run loot before buttons, no duplicate mobile panels');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
