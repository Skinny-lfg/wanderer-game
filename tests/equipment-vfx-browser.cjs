const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8012';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/online/firebase-client.mjs*',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/firebase-client.mjs','utf8')}));
 await page.route(URL+'/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('index.html','utf8').replace('load();if(!state.merchant)rollShop();save();render();','globalThis.assetTest={itemImg,animateStrike,animateDefense,animateEnemyStrike,floatText,rarityFrame};load();if(!state.merchant)rollShop();save();render();')}));
 await page.goto(URL+'/');await page.locator('#googleSignIn').click();await page.locator('#nickname').fill('Skinny');await page.locator('#createProfile').click();await page.waitForFunction(()=>!document.querySelector('.onlineDialog'));
 assert.equal(await page.locator('[data-online-action="account"]').innerText(),'skinny');
 const results=await page.evaluate(async()=>{
  const mappings={helm:'helmet',armor:'chest',gloves:'gloves',boots:'boots',ring1:'ring',ring2:'ring'};const result=[];
  for(const [slot,key] of Object.entries(mappings)){
   const item={id:'retained-save-'+slot,slot,subtype:slot,name:'Saved equipment',rarity:'Common'};const before=JSON.stringify(item),src=assetTest.itemImg(item);
   if(!src.startsWith('assets/equipment/'+key+'_'))throw Error('Wrong slot image '+slot);
   for(const rarity of ['Common','Uncommon','Rare','Epic','Legendary']){item.rarity=rarity;if(assetTest.itemImg(item)!==src)throw Error('Rarity changed image');if(!assetTest.rarityFrame(item).includes(rarity))throw Error('Wrong rarity frame');}
   item.rarity='Common';if(JSON.stringify(item)!==before)throw Error('Item mutated');
   const img=new Image();img.src=src;await img.decode();result.push(src);
  }return result;
 });assert.equal(results.length,6);
 await page.locator('[data-nav="dungeons"]').click();await page.locator('#enter').click();await page.locator('[data-confirm]').click();await page.locator('#scene').waitFor();
 // Exercise real animation entrypoints in the combat scene; no production test hooks.
 for(const kind of ['Sword','Mace','Daggers','Off-Hand Dagger','Two-Handed','Bow','Staff','Wand','Block']){
  const result=await page.evaluate(async kind=>{
   const scene=document.getElementById('scene'),before=scene.getBoundingClientRect().height;
   if(kind==='Block')assetTest.animateDefense();else assetTest.animateStrike(kind,['Staff','Wand'].includes(kind));
   const effects=[...scene.querySelectorAll('.combatVfx')],fx=effects.findLast(x=>x.dataset.kind===kind);if(!fx)throw Error('Missing effect '+kind);
   const visible=getComputedStyle(fx).display!=='none',
    animation=getComputedStyle(fx).animationName,
    actorAnimation=getComputedStyle(document.getElementById('heroPortrait')).animationName;
    await fx.querySelector('img').decode();
    return {src:fx.querySelector('img').getAttribute('src'),stable:scene.getBoundingClientRect().height===before,visible,animation,actorAnimation};
  },kind);assert.ok(result.stable);assert.match(result.src,/assets\/combat-vfx\/.+\.png/);
  assert.equal(result.visible,true,kind+' overlay must be visible');
  assert.notEqual(result.animation,'none',kind+' effect must animate');
  assert.notEqual(result.actorAnimation,'none',kind+' player must animate');
 }
 const restored=await page.evaluate(()=>{
  assetTest.floatText(24);assetTest.animateEnemyStrike();
  const dmg=document.querySelector('.scene .float');
  const enemy=document.getElementById('enemyPortrait');
  return {damageVisible:getComputedStyle(dmg).display!=='none',damageAnimation:getComputedStyle(dmg).animationName,
   enemyAnimation:getComputedStyle(enemy).animationName};
 });
 assert(restored.damageVisible,'floating combat damage must be visible');
 assert.equal(restored.damageAnimation,'rise','floating damage animation restored');
 assert.equal(restored.enemyAnimation,'fxEnemyAttack','enemy attack movement restored');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>assetTest.animateStrike('Bow'));assert.equal(await page.locator('.combatVfx[data-kind="Bow"]').last().evaluate(e=>getComputedStyle(e).animationName),'vfxFade');
 await page.evaluate(()=>{for(let i=0;i<20;i++)assetTest.animateStrike('Sword');if(document.querySelectorAll('.combatVfx').length>8)throw Error('Too many effects');});
 await page.waitForTimeout(800);assert.equal(await page.locator('.combatVfx').count(),0);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 await page.screenshot({path:`/tmp/wanderer-vfx-${width}.png`});console.log(`PASS ${width}px: nickname, all armor slots, rarity independence, 9 effect paths, reduced motion and stable combat layout`);await page.close();
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
