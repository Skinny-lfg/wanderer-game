// Firebase boundary is mocked: these are browser flow tests, not live OAuth tests.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8010';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [1440,390,320]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/online/firebase-client.mjs*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/firebase-client.mjs','utf8')}));
 await page.addInitScript(()=>{
  const slots={helm:null,amulet:null,armor:null,gloves:null,weapon:{id:'heavy',slot:'weapon',subtype:'Two-Handed',name:'Legacy heavy',tier:10,rarity:'Epic',atk:999,agi:99,def:1000},offhand:null,ring1:null,ring2:null,boots:null};
  localStorage.setItem('wanderer_browser_proto_v01',JSON.stringify({resetVersion:'older-main-version',maxDungeon:12,chosen:1,stashCapacity:80,gold:111,fragments:222,stash:[],equip:slots,valuables:[],offersByLevel:{},merchant:null,run:null}));
 });
 await page.goto(URL);await page.waitForFunction(()=>!!globalThis.__firebaseTest);
 const snapshot=()=>page.evaluate(()=>WandererGame.snapshot());
 assert.equal((await snapshot()).gold,111);assert.ok(await page.locator('#screen').evaluate(e=>e.inert));
 await page.keyboard.press('Escape');assert.ok(await page.locator('#googleSignIn').isVisible());
 await page.locator('#googleSignIn').click();await page.locator('#nickname').fill('taken');await page.locator('#createProfile').click();assert.match(await page.locator('.onlineDialog .onlineError').innerText(),/taken/);
 await page.locator('#nickname').fill('Alice_1');await page.locator('#createProfile').click();await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_alice'&&!document.querySelector('.onlineDialog'));
 assert.equal((await snapshot()).gold,111);assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),111);await page.waitForFunction(()=>__firebaseTest.shared===1);
 assert.ok(!(await page.locator('#screen').evaluate(e=>e.inert)));
 const account=()=>page.locator('[data-online-action="account"]').click(),close=()=>page.locator('.onlineDialog [data-close]').click();
 await account();assert.equal(await page.locator('[data-character]').count(),5);
 for(const id of ['wanderer','ranger','knight','spellblade','duelist']){await page.locator(`[data-character="${id}"]`).click();await page.locator('#saveCharacter').click();assert.equal((await snapshot()).characterId,id);}
 assert.equal(await page.locator('#reviewCloud,#syncNow,#importSave,#exportSave,#backups,#onlineStatus').count(),0);
 await close();
 await page.locator('[data-online-action="feedback"]').click();
 await page.locator('#feedbackForm').waitFor();
 await page.locator('[name="category"]').selectOption('bug');
 await page.locator('[name="rating"]').selectOption('4');
 await page.locator('[name="combat"]').selectOption('repetitive');
 await page.locator('[name="problems"]').fill('Repeated dungeon clicks feel excessive.');
 await page.locator('#sendFeedback').click();
 await page.locator('.feedbackThanks').waitFor();
 assert.equal(await page.evaluate(()=>__firebaseTest.feedback.length),1);
 assert.equal(await page.evaluate(()=>__firebaseTest.feedback[0].category),'bug');
 await page.locator('#feedbackDone').click();
 await page.locator('[data-online-action="leaderboard"]').click();await page.locator('.rankingList').waitFor();assert.equal(await page.locator('#publishResults,.experimental').count(),0);assert.ok(!(await page.locator('.onlineDialog').innerText()).includes('Unverified'));
 for(const mode of ['first','fastest','deepest']){await page.locator('#ranking').selectOption(mode);await page.locator('.rankingList').waitFor();}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await close();
 // Timed autosync automatically publishes changed progress, but does not repeat unchanged scores.
 await page.clock.install();await page.evaluate(()=>{const s=WandererGame.snapshot();s.onlineProgress.deepestCleared=20;s.onlineProgress.milestones[20]={activeMs:60000};WandererGame.switchSave(WandererGame.key(),s);});
 await page.clock.fastForward(31000);await page.waitForFunction(()=>__firebaseTest.shared===2);
 await page.clock.fastForward(31000);assert.equal(await page.evaluate(()=>__firebaseTest.shared),2);
 // Concurrent remote changes preserve both copies and request a choice only on conflict.
 await page.evaluate(()=>{const s=JSON.parse(__firebaseTest.cloud.payload);s.gold=999;__firebaseTest.cloud={payload:JSON.stringify(s),revision:__firebaseTest.cloud.revision+1};WandererGame.recordActive(1000);});
 await page.clock.fastForward(31000);await page.locator('#downloadCloud').waitFor();assert.equal((await snapshot()).gold,111);assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),999);
 await page.locator('#downloadCloud').click();assert.equal((await snapshot()).gold,999);
 // Transient failures preserve local state; reconnect retries automatically.
 await page.evaluate(()=>{__firebaseTest.offline=true;WandererGame.recordActive(1000)});await page.clock.fastForward(31000);assert.match(await page.locator('#accountError').innerText(),/unavailable/);assert.equal((await snapshot()).gold,999);
 await page.evaluate(()=>{__firebaseTest.offline=false;dispatchEvent(new Event('online'))});await page.clock.fastForward(31000);assert.ok(await page.locator('#accountError').isHidden());
 await account();await page.locator('#googleSignOut').click();await page.locator('#googleSignIn').waitFor();assert.ok(await page.locator('#screen').evaluate(e=>e.inert));await page.keyboard.press('Escape');assert.ok(await page.locator('#googleSignIn').isVisible());
 await page.locator('#googleSignIn').click();await page.waitForFunction(()=>!document.querySelector('.onlineDialog'));assert.equal((await snapshot()).gold,999);
 // A duplicate auth event is intentionally ignored by the app. Reproduce an actual
 // failed profile fetch during startup rather than asserting a discarded event runs.
 await page.evaluate(()=>sessionStorage.setItem('firebaseRefreshSeed',JSON.stringify({
  user:__firebaseTest.user,profile:__firebaseTest.profile,cloud:__firebaseTest.cloud,
  profileError:'permission-denied'
 })));
 await page.reload();
 await page.locator('#retryProfile').waitFor();assert.equal(await page.locator('#nickname,#createProfile').count(),0);
 await page.evaluate(()=>__firebaseTest.profileError=null);await page.locator('#retryProfile').click();
 await page.waitForFunction(()=>!document.querySelector('.onlineDialog'));
 // Full browser refresh restores the same Google user/profile and keeps its save.
 await page.evaluate(()=>sessionStorage.setItem('firebaseRefreshSeed',JSON.stringify({user:__firebaseTest.user,profile:__firebaseTest.profile,cloud:__firebaseTest.cloud})));
 await page.reload();await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_alice'&&!document.querySelector('.onlineDialog'));
 await account();assert.match(await page.locator('.onlineDialog').innerText(),/alice_1/);assert.equal(await page.locator('#nickname,#createProfile,#backups,#exportSave').count(),0);assert.equal((await snapshot()).gold,999);await close();
 // A second account starts fresh, without copying the first account or legacy slot.
 await account();await page.locator('#googleSignOut').click();
 await page.evaluate(async()=>{__firebaseTest.user={uid:'bob'};__firebaseTest.profile={nickname:'bob',characterId:'ranger'};__firebaseTest.cloud=null;await __firebaseTest.restore();});
 await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_bob');assert.equal((await snapshot()).gold,0);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wanderer_account_alice')).gold),999);
 // An unchanged local copy restores newer cloud progress without a review dialog.
 await page.evaluate(async()=>{const s=JSON.parse(__firebaseTest.cloud.payload);s.gold=777;__firebaseTest.cloud={payload:JSON.stringify(s),revision:__firebaseTest.cloud.revision+1};await __firebaseTest.restore();});
 assert.equal((await snapshot()).gold,777);assert.equal(await page.locator('#uploadLocal').count(),0);
 
 assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('wanderer_backup_'))));
 // Anonymous users share the leaderboard under their reserved nickname.
 await account();await page.locator('#googleSignOut').click();
 await page.locator('#guestSignIn').click();await page.locator('#nickname').fill('GuestHero');await page.locator('#createProfile').click();
 await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_guest-1'&&!document.querySelector('.onlineDialog'));
 assert.equal(await page.locator('[data-online-action="account"]').innerText(),'guesthero');
 await page.locator('[data-online-action="leaderboard"]').click();await page.locator('.rankingList').waitFor();

 assert.match(await page.locator('.rankingList').innerText(),/guesthero/);
 await close();
 // Re-opening the browser must restore the SAME anonymous UID, profile and save.
 // A saved in-flight run from a closed tab must never trap Account behind a busy error.
 const beforeGuest=await snapshot();
 await page.evaluate(()=>{
  const key=WandererGame.key(),save=JSON.parse(localStorage.getItem(key));
  save.run={tier:1,path:'grove',status:'fight',gold:0,fragments:0,loot:[],valuables:[]};
  localStorage.setItem(key,JSON.stringify(save));
  sessionStorage.setItem('firebaseRefreshSeed',JSON.stringify({
   user:__firebaseTest.user,profile:__firebaseTest.profile,cloud:__firebaseTest.cloud
  }));
 });
 await page.reload();
 await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_guest-1'&&!document.querySelector('.onlineDialog'));
 assert.equal((await snapshot()).run,null,'interrupted run closed on reload');
 assert.equal((await snapshot()).gold,beforeGuest.gold,'guest gold retained');
 assert.equal((await snapshot()).maxDungeon,beforeGuest.maxDungeon,'guest progression retained');
 const originalRunBackups=await page.evaluate(()=>Object.keys(localStorage)
  .filter(k=>k.startsWith('wanderer_backup_')).map(k=>JSON.parse(localStorage.getItem(k)))
  .filter(x=>x.label==='interrupted-run-before-recovery'));
 assert.ok(originalRunBackups.some(x=>JSON.parse(x.raw).run?.status==='fight'),'raw interrupted guest save backed up');
 assert.equal(await page.locator('[data-online-action="account"]').innerText(),'guesthero');
 assert.ok(!(await page.locator('#screen').evaluate(e=>e.inert)),'guest game playable after reopen');
 await page.evaluate(async()=>{await __firebaseTest.restore();});
 assert.equal(await page.locator('.onlineDialog').count(),0,'duplicate guest auth event does not reopen account');
 await account();assert.match(await page.locator('.guestNotice').innerText(),/signing out/);
 await page.locator('#googleSignOut').click();assert.match(await page.locator('.onlineDialog').innerText(),/cannot be recovered/);
 await page.locator('#keepGuest').click();assert.ok(await page.locator('#googleSignOut').isVisible());await close();
 assert.deepEqual(errors,[]);
 console.log(`PASS ${width}px: login required, migration, cosmetics, automatic sync/rankings, conflicts, offline retry, sign-out and return`);await page.close();
 }}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
