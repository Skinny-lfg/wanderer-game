const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8012';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [1440,390])for(const guest of [true,false])for(const source of ['local','cloud','both','conflict']){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/online/firebase-client.mjs*',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/firebase-client.mjs','utf8')}));
 await page.addInitScript(({guest,source})=>{
  const uid=guest?'guest-1':'alice',key='wanderer_account_'+uid;
  const base={characterId:'knight',gold:124,fragments:40,maxDungeon:13,chosen:12,stashCapacity:80,stash:[{id:'stored',name:'Stored Helm',slot:'helm',subtype:'Helm',tier:8,rarity:'Rare'}],equip:{weapon:{id:'safe-sword',name:'Saved Sword',slot:'weapon',subtype:'Sword',tier:10,rarity:'Rare',atk:30}},run:null,protectedItemIds:['safe-sword']};
  const run={tier:12,path:'grove',status:'fight',gold:500,fragments:500,loot:[{id:'unextracted'}]};
  const local={...base,run:source==='cloud'?null:run};
  const remote={...base,run:source==='local'?null:run,gold:source==='conflict'?999:124};
  localStorage.setItem(key,JSON.stringify(local));localStorage.setItem(key+'_synced',JSON.stringify(source==='conflict'?{...base,gold:8}:base));localStorage.setItem('wanderer_browser_proto_v01_claimed',uid);
  sessionStorage.setItem('firebaseRefreshSeed',JSON.stringify({user:{uid,isAnonymous:guest},profile:{nickname:guest?'returning_guest':'returning_google',characterId:'knight'},cloud:{payload:JSON.stringify(remote),revision:7}}));
 },{guest,source});
 await page.goto(URL);
 if(source==='conflict'){
  await page.locator('#uploadLocal').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),999);await page.locator('#uploadLocal').click();
 }
 await page.waitForFunction(()=>WandererGame.key().startsWith('wanderer_account_')&&!document.querySelector('.onlineDialog'));
 const state=await page.evaluate(()=>WandererGame.snapshot());assert.equal(state.run,null);assert.equal(state.gold,124);assert.equal(state.fragments,40);assert.equal(state.maxDungeon,13);assert.equal(state.equip.weapon.id,'safe-sword');assert.equal(state.stash[0].id,'stored');assert.deepEqual(state.protectedItemIds,['safe-sword']);
 assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).run),null);
 assert.ok(!(await page.locator('#screen').evaluate(e=>e.inert)));
 const backups=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('wanderer_backup_')).map(k=>JSON.parse(localStorage.getItem(k))));
 assert.ok(backups.some(b=>JSON.parse(b.raw)?.run?.gold===500),'original interrupted data retained');
 // Duplicate authentication notifications must not interrupt the recovered session.
 await page.evaluate(()=>__firebaseTest.restore());assert.equal(await page.locator('.onlineDialog').count(),0);
 assert.deepEqual(errors,[]);console.log(`PASS ${width}px ${guest?'Guest':'Google'} ${source}: preserved profile, gold, gear, protection and backup; cloud run cleared safely`);await page.close();
 }
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
