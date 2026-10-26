'use strict';
// Local private-preview only; all game data and browser storage are synthetic.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const {createPrivatePreviewServer}=await import('../preview/private-server.mjs');
 const server=createPrivatePreviewServer({username:'gauntlet-tester',password:'synthetic-gauntlet-preview-only',allowLocalHttp:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),evidence=path.resolve(__dirname,'../test-results/v013-phase2a');
 fs.mkdirSync(evidence,{recursive:true});
 try{
  for(const [width,speed] of [[390,1],[390,4],[1280,1],[1280,4]]){
   const context=await browser.newContext({viewport:{width,height:width<700?844:900},isMobile:width<700,hasTouch:width<700}),page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>requests.push(request.url()));
   await context.route('**/*',request=>request.request().url().startsWith(base)?request.continue():request.abort());
   await page.goto(base);await page.locator('#user').fill('gauntlet-tester');await page.locator('#pass').fill('synthetic-gauntlet-preview-only');await page.getByRole('button',{name:'Enter Playtest'}).click();
   await page.waitForFunction(()=>globalThis.WandererGame?.validationStatus().ready);
   await page.goto(base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=gauntlet-'+width+'-'+speed+'&gauntlet=8');await page.waitForFunction(()=>globalThis.WandererGame?.validationStatus().ready);
   // Match the synthetic seed whose initial Blood-affinity route is a normal
   // encounter, so this browser check tests Gauntlet rather than Elite rules.
   await page.evaluate(()=>{Math.random=()=>4270654815/4294967296;});
   const start=page.locator('[data-phase1-expedition="1"]').first();await start.click();await page.locator('dialog[data-initial-affinity]').waitFor();await page.locator('dialog[data-initial-affinity] [data-close]').click();
   await page.locator('[data-phase1-expedition="1"]').first().click();await page.locator('[data-phase2-initial="blood"]').click();await page.locator('#enemyPortrait').waitFor();
   await page.waitForFunction(()=>document.querySelector('#combatEncounterProgress')?.textContent.includes('Enemies 1/8'));
   for(let i=0;i<(speed===4?2:0);i++)await page.locator('#combatSpeed').click();
   assert.equal(await page.locator('#combatSpeed .combatSpeedValue').textContent(),'×'+speed);
   const run=await page.evaluate(()=>WandererGame.snapshot().run);assert.equal(run.gauntlet?.count,8);assert.equal(run.status,'fight');
   await page.screenshot({path:path.join(evidence,`gauntlet-${width}-${speed}x.png`),fullPage:true});
   const firstKillStart=Date.now();await page.waitForFunction(()=>document.querySelector('#combatEncounterProgress')?.textContent.includes('Enemies 2/8'),null,{timeout:speed===1?25000:12000});const firstKillElapsedMs=Date.now()-firstKillStart;
   assert.equal(await page.locator('dialog[open]').count(),0,'micro-kill transition opens no popup');
   const next=await page.evaluate(()=>WandererGame.snapshot().run);assert.equal(next.gauntlet.index,1);assert.equal(next.status,'fight');
   const checkpoint={id:next.enemy.gauntletMobId,index:next.gauntlet.index,gold:next.gold,fragments:next.fragments};
   await page.reload();await page.waitForFunction(()=>globalThis.WandererGame?.validationStatus().ready);
   await page.waitForFunction(()=>document.querySelector('#combatEncounterProgress')?.textContent.includes('Enemies 2/8'));
   const resumed=await page.evaluate(()=>WandererGame.snapshot().run);assert.equal(resumed.gauntlet.index,checkpoint.index);assert.equal(resumed.enemy.gauntletMobId,checkpoint.id);assert.equal(resumed.gold,checkpoint.gold);assert.equal(resumed.fragments,checkpoint.fragments);assert.equal(resumed.status,'fight');
   const second=await context.newPage();await second.goto(base+`/?expeditionPhase1=1&expeditionSave=1&validationSlot=gauntlet-tab2-${width}-${speed}&gauntlet=8`);await second.waitForFunction(()=>globalThis.WandererGame?.validationStatus().ready);
   assert.equal((await second.evaluate(()=>WandererGame.snapshot().run)),null,'separate test tab must not inherit or mutate the first tab run');
   await page.evaluate(()=>Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'}));const hiddenCombatSeconds=(await page.evaluate(()=>WandererGame.snapshot().run)).combatSeconds;await page.waitForTimeout(500);const afterBackground=(await page.evaluate(()=>WandererGame.snapshot().run)).combatSeconds;assert.equal(afterBackground,hiddenCombatSeconds,'background tab must pause combat ticks');
   await page.evaluate(()=>Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'}));await page.waitForFunction(value=>WandererGame.snapshot().run.combatSeconds>value,afterBackground);const stillFirst=await page.evaluate(()=>WandererGame.snapshot().run);assert.equal(stillFirst.gauntlet.index,checkpoint.index);await second.close();assert.deepEqual(errors,[]);
   assert(!requests.some(url=>url.includes('/online/app.mjs')||url.includes('firebase-sdk')),'local experiment must not contact Firebase');
   console.log(`PASS local Gauntlet browser ${width}px ×${speed}: first-kill ${firstKillElapsedMs}ms; checkpoint reload, isolated second tab, no popup or Firebase request`);await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
