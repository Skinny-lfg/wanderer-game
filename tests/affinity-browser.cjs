const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8012';
const hooks=`globalThis.affinityTest={
 setup(effect){clearInterval(clock);const equipment=makeSlots();for(const slot of ['weapon','helm','armor','gloves','boots'])equipment[slot]={id:slot,name:'Test '+slot,slot,subtype:slot==='weapon'?'Sword':'Armor',rarity:'Legendary',tier:20,atk:slot==='weapon'?30:0,effect};state.equip=equipment;selectedPath=THEMES[0].id;const stats=totalStats();state.run={stats,hp:stats.maxhp,maxhp:stats.maxhp,mp:stats.mana,maxmp:stats.mana,barrier:0,tier:10,path:selectedPath,enc:1,status:'fight',enemy:enemyFor(10,1),tPlayer:0,tEnemy:0,tDot:0,loot:[],valuables:[],gold:0,fragments:0};state.run.enemy.hp=state.run.enemy.maxhp=100000;state.run.enemy.attackEvery=100;view='combat';Affinity.beginEncounter(state.run);renderCombat();},
 prime(){const r=state.run,a=Affinity.state(r);a.focus=3;a.focusUntil=10;a.heat=5;a.heatUntil=10;a.souls=3;a.soulsUntil=10;a.speed=[3,3,3];updateBars();},
 step(){clearInterval(clock);for(let i=0;i<20;i++)updateFight();},
 compare(){return setPreview({id:'replacement',name:'Replacement',slot:'helm',subtype:'Helm',effect:'crit',rarity:'Rare'});},
 details(){return setDetails(state.run.stats);}
};`;
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/online/firebase-client.mjs*',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/firebase-client.mjs','utf8')}));
 await page.route(URL+'/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8').replace('load();if(!state.merchant)rollShop();save();render();',hooks+'load();if(!state.merchant)rollShop();save();render();')}));
 await page.goto(URL+'/');await page.locator('#googleSignIn').click();await page.locator('#nickname').fill('AffinityTester');await page.locator('#createProfile').click();await page.waitForFunction(()=>!document.querySelector('.onlineDialog'));
 for(const effect of ['poison','bleed','sunder','crit','shield','regen','burn','slow','drain']){
  await page.evaluate(e=>affinityTest.setup(e),effect);
  const details=await page.locator('.combatSetList').innerText();for(const t of [2,3,5])assert.ok(details.includes(t+' pieces · Active'));
  const before=await page.locator('#scene').boundingBox(),statusBefore=await page.locator('#affinityStatus').boundingBox();await page.evaluate(()=>affinityTest.prime());
  assert.deepEqual(await page.locator('#scene').boundingBox(),before);assert.deepEqual(await page.locator('#affinityStatus').boundingBox(),statusBefore);
  await page.evaluate(()=>affinityTest.step());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow '+effect);
 }
 await page.evaluate(()=>affinityTest.setup('poison'));assert.match(await page.evaluate(()=>affinityTest.compare()),/Removes 5-piece effect/);
 for(const label of ['×2 Speed','×4 Speed','×1 Speed']){await page.locator('#combatSpeed').click();assert.equal(await page.locator('#combatSpeed').innerText(),label);await page.evaluate(()=>affinityTest.step());}
 await page.screenshot({path:`/tmp/wanderer-affinities-${width}.png`,fullPage:true});assert.deepEqual(errors,[]);console.log(`PASS ${width}px: nine cumulative sets, resource indicators, stable layout, comparison and 1×/2×/4× controls; no JS errors`);await page.close();
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
