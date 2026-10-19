// Native Phase 3 UI with synthetic profiles only. No combat/balance simulation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){phase1Init();globalThis.__persist={
 snap:()=>({gold:state.gold,fragments:state.fragments,equip:state.equip,stash:state.stash,enemy:state.run?.enemy,enc:state.run?.enc,g:phase1Controller.state,draft:phase1Draft,build:phase1Build,results:phase5Results}),
 begin:()=>{phase1Begin(1);phase2ChooseInitial('blood');},
 enter:()=>{const p=phase1Controller.state.offers.find(o=>o.family==='blood');p.waves=2;phase1Choose(p.id);phase1Enter();},
 log:()=>{for(let i=0;i<120;i++)addLog('Recorded action '+i);},death:()=>phase1Death(),
 boss:()=>{const g=phase1Controller.state,r=state.run;g.history=Array.from({length:14},(_,i)=>({...g.selected,plane:i+1,boss:false,event:['chest','event','altar'].includes(g.rooms[i])?g.rooms[i]:null}));g.planeIndex=15;g.wave=3;g.offers.forEach(p=>{p.boss=true;p.waves=3;p.elite=true;p.event=null;});r.phase1Plane=15;r.planeWaves=3;r.enc=3;r.enemy.boss=true;phase4Entry.session.controller=phase4Clone(g);phase4Entry.session.controller.wave=1;phase5Persist();},
 reroll:()=>phase3Reroll(0),win:()=>{state.run.enemy.hp=0;phase1WaveWon();},pick:()=>phase2ChoosePassive(phase1Draft.options[0].id),
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
 let context=await browser.newContext({viewport:{width,height:900}});let page;
 const errors=[];
 async function open(){await context.addInitScript(()=>{window.setInterval=()=>0;const timeout=window.setTimeout;window.setTimeout=(f,t,...a)=>timeout(f,t===650?5:t,...a);});page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await page.goto(base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=phase4');await page.waitForFunction(()=>WandererGame.validationStatus().ready);}
 const snap=()=>page.evaluate(()=>__persist.snap());const stored=()=>page.evaluate(()=>__persist.stored());
 await open();await page.evaluate(()=>__persist.begin());const home=(await snap()).equip;
 await page.evaluate(()=>{__persist.reroll();});
 await page.evaluate(()=>__persist.enter());const entry=await snap();assert.equal((await stored()).expedition.session.entry,true);
 const other=await context.newPage();await other.goto(base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=phase4');await other.waitForFunction(()=>WandererGame.validationStatus().blocked);assert.equal(await other.evaluate(()=>WandererGame.validationStatus().ready),false);await other.close();
 await page.evaluate(()=>__persist.win());await page.waitForFunction(()=>__persist.snap().enc===2);const partial=await snap();assert(partial.gold>entry.gold);assert.equal((await stored()).profile.gold,entry.gold);assert.equal((await stored()).expedition.awardKeys.length,0);
 // Close the browser context and recreate it using only persisted storage.
 await page.goto('about:blank');const storageState=await context.storageState();await context.close();context=await browser.newContext({viewport:{width,height:900},storageState});await open();
 assert.equal(await page.locator('#phase4Resume').count(),1);assert.equal((await snap()).gold,entry.gold);await page.locator('#phase4Resume').click();assert.deepEqual((await snap()).enemy,entry.enemy);
 await page.evaluate(()=>__persist.win());await page.waitForFunction(()=>__persist.snap().enc===2);const replay=await snap();assert.equal(replay.gold,partial.gold);assert.equal(replay.fragments,partial.fragments);assert.deepEqual(replay.stash,partial.stash);
 await page.evaluate(()=>__persist.win());await page.waitForFunction(()=>!!document.querySelector('#phase5ExitResult'));assert.match(await page.locator('h1').textContent(),/REALM CLEARED/);await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);assert.match(await page.locator('h1').textContent(),/REALM CLEARED/);await page.locator('#phase5ExitResult').click();await page.waitForFunction(()=>!!document.querySelector('[data-phase2-passive]'));const completed=await snap(),offers=completed.draft.options.map(p=>p.id);assert.equal((await stored()).expedition.awardKeys.length,2);
 await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);assert.deepEqual((await snap()).draft.options.map(p=>p.id),offers);assert.equal((await snap()).g.rerollsByRealm[0][0],2);
 await page.evaluate(()=>__persist.pick());await page.locator('#phase4Extract').click();await page.locator('dialog [data-confirm]').click();const end=await stored();assert.equal(end.expedition.lastOutcome,'extracted');assert.equal(end.expedition.unlocked,1);assert.equal(end.expedition.active,null);assert.equal(end.profile.gold,completed.gold);assert.deepEqual(end.profile.equip,home);
 await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);assert.equal((await snap()).gold,completed.gold);assert.match(await page.locator('h1').textContent(),/EXTRACTION COMPLETE/);
 await page.locator('#phase5ExitResult').click();await page.locator('[data-online-action="leaderboard"]').click();assert.match(await page.locator('dialog').textContent(),/pending server validation/);await page.locator('dialog [data-close]').click();
 await page.evaluate(()=>{__persist.begin();__persist.enter();__persist.log();__persist.death();});assert.match(await page.locator('h1').textContent(),/YOU DIED/);assert((await snap()).results.realm.log.length>=120);
 const deathSave=await stored();await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);assert.match(await page.locator('h1').textContent(),/YOU DIED/);await page.locator('.phase5LastLog summary').click();assert(await page.locator('.phase5LastLog .log').isVisible());assert.equal((await stored()).profile.gold,deathSave.profile.gold);await page.locator('#phase5ExitResult').click();assert.match(await page.locator('h1').textContent(),/EXPEDITION LOST/);await page.locator('#phase5ExitResult').click();
 await page.evaluate(()=>{__persist.begin();__persist.enter();__persist.boss();__persist.win();});assert.match(await page.locator('h1').textContent(),/REALM CLEARED/);assert.equal((await stored()).expedition.completed,1);assert.equal((await stored()).expedition.unlocked,2);assert.equal((await snap()).results.summary.realms,15);assert.equal((await snap()).results.summary.runeTier,null);
 await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);await page.locator('#phase5ExitResult').click();assert.match(await page.locator('h1').textContent(),/EXPEDITION COMPLETE/);const victory=await stored();await page.locator('#phase5ExitResult').click();await page.reload();await page.waitForFunction(()=>WandererGame.validationStatus().ready);assert.equal((await stored()).expedition.completed,1);assert.equal((await stored()).profile.gold,victory.profile.gold);assert.deepEqual(errors,[]);await context.close();console.log('PASS Phase 4/5 '+width+'px: fixed-entry replay, two-tab lock, atomic rewards, persisted drafts/rerolls, extraction');
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
