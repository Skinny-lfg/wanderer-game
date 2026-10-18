// Firebase boundary is mocked: these are browser flow tests, not live OAuth tests.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8010';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [1440,390,320]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/online/firebase-client.mjs*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/firebase-client.mjs','utf8')}));
 await page.route('**/online/firebase-config.mjs*',route=>route.fulfill({contentType:'text/javascript',body:"export const firebaseConfig={projectId:'demo-wanderer-dev'};"}));
 await page.addInitScript(()=>{
  window.__accountDialogOpens=0;
  const original=HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal=function(...args){
   if(this.classList.contains('onlineDialog')&&this.querySelector('#onlineDialogTitle')?.textContent==='Account & Character')window.__accountDialogOpens++;
   return original.apply(this,args);
  };
  const slots={helm:null,amulet:null,armor:null,gloves:null,weapon:{id:'heavy',slot:'weapon',subtype:'Two-Handed',name:'Legacy heavy',tier:10,rarity:'Epic',atk:999,agi:99,def:1000},offhand:null,ring1:null,ring2:null,boots:null};
  localStorage.setItem('wanderer_browser_proto_v01',JSON.stringify({resetVersion:'older-main-version',maxDungeon:12,chosen:1,stashCapacity:80,gold:111,fragments:222,stash:[],equip:slots,valuables:[],offersByLevel:{},merchant:null,run:null}));
 });
 await page.goto(URL);await page.waitForFunction(()=>!!globalThis.__firebaseTest);
 const snapshot=()=>page.evaluate(()=>WandererGame.snapshot());
 assert.equal((await snapshot()).gold,111);assert.ok(await page.locator('#screen').evaluate(e=>e.inert));
 await page.keyboard.press('Escape');assert.ok(await page.locator('#googleSignIn').isVisible());
  // Email sign-up, account verification and password reset; no Guest mode.
  assert.equal(await page.locator('#guestSignIn').count(),0);
  await page.locator('#loginEmail').fill('tester@example.com');
  await page.locator('#loginPassword').fill('secure-password-123');
  await page.locator('#passwordReset').click();
  assert.match(await page.locator('#passwordResetStatus').innerText(),/password-reset/);
  await page.locator('#emailRegister').click();
 await page.locator('#registrationForm').waitFor();
 assert.equal(await page.locator('#registerNickname,#registerEmail,#registerPassword,#registerPasswordConfirm').count(),4);
 await page.locator('#registerNickname').fill('Test_Email');
 await page.locator('#registerEmail').fill('tester@example.com');
 await page.locator('#registerPassword').fill('secure-password-123');
 await page.locator('#registerPasswordConfirm').fill('not-matching');
 await page.locator('#submitRegistration').click();
 assert.match(await page.locator('.onlineDialog .onlineError').innerText(),/Passwords do not match/);
 await page.locator('#registerPasswordConfirm').fill('secure-password-123');
 await page.locator('#submitRegistration').click();
 await page.locator('#refreshVerification').waitFor();
 assert.ok(await page.locator('#screen').evaluate(e=>e.inert));
 await page.locator('#resendVerification').click();
 await page.locator('#refreshVerification').click();
 await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_demo-wanderer-dev_email-user_v092'&&!document.querySelector('.onlineDialog'));
 assert.equal(await page.locator('[data-online-action="account"]').innerText(),'test_email','nickname chosen during registration');
 await page.locator('[data-online-action="account"]').click();
 await page.locator('#googleSignOut').click();
 await page.locator('#googleSignIn').waitFor();
 await page.evaluate(()=>{__firebaseTest.profile=null;__firebaseTest.cloud=null;});
 await page.locator('#googleSignIn').click();await page.locator('#nickname').fill('taken');await page.locator('#createProfile').click();assert.match(await page.locator('.onlineDialog .onlineError').innerText(),/taken/);
 await page.locator('#nickname').fill('Alice_1');await page.locator('#createProfile').click();await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_demo-wanderer-dev_alice_v092'&&!document.querySelector('.onlineDialog'));
 assert.equal((await snapshot()).gold,0,'legacy Guest Gold must not transfer after global reset');assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),0);await page.waitForFunction(()=>__firebaseTest.shared===1);
 assert.ok(!(await page.locator('#screen').evaluate(e=>e.inert)));
 assert.equal((await snapshot()).maxDungeon,1,'all accounts begin the new season in D1');
 assert.equal((await snapshot()).equip.weapon?.id||null,null,'old Two-Handed weapon must not be imported');
 const menuAction=async action=>{
  if(width<=650){
   const toggle=page.locator('#menuToggle');
   if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
  }
  await page.locator('[data-online-action="'+action+'"]').click();
 };
 const account=()=>menuAction('account'),close=()=>page.locator('.onlineDialog [data-close]').click();
 await account();assert.deepEqual(await page.locator('.characterPicker button span').allInnerTexts(),['Paladin','Ranger','Warrior','Wizard','Rogue'],'updated cosmetic names load after login');assert.equal(await page.locator('[data-character]').count(),5);assert.equal(await page.locator('.characterPicker img').first().evaluate(el=>getComputedStyle(el).borderRadius),'0px','character portraits should not be circular');
 for(const id of ['wanderer','ranger','knight','spellblade','duelist']){await page.locator(`[data-character="${id}"]`).click();await page.locator('#saveCharacter').click();assert.equal((await snapshot()).characterId,id);}
 assert.equal(await page.locator('#reviewCloud,#syncNow,#importSave,#exportSave,#backups,#onlineStatus').count(),0);
 await close();
 await menuAction('feedback');
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
 await menuAction('leaderboard');await page.locator('.rankingList').waitFor();assert.equal(await page.locator('#publishResults,.experimental').count(),0);assert.ok(!(await page.locator('.onlineDialog').innerText()).includes('Unverified'));
 assert.equal(await page.locator('#ranking').inputValue(),'fastest');assert.equal(await page.locator('#milestone,#ranking option[value="first"]').count(),0);
 for(const mode of ['deepest','fastest']){await page.locator('#ranking').selectOption(mode);await page.locator('.rankingList').waitFor();}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await close();
 // Timed autosync automatically publishes changed progress, but does not repeat unchanged scores.
 await page.clock.install();await page.evaluate(()=>{const s=WandererGame.snapshot();s.onlineProgress.deepestCleared=20;s.onlineProgress.milestones[20]={activeMs:60000};WandererGame.switchSave(WandererGame.key(),s);});
 await page.clock.fastForward(31000);await page.waitForFunction(()=>__firebaseTest.shared===2);
 await page.clock.fastForward(31000);assert.equal(await page.evaluate(()=>__firebaseTest.shared),2);
 // Concurrent remote changes preserve both copies and request a choice only on conflict.
 await page.evaluate(()=>{const s=JSON.parse(__firebaseTest.cloud.payload);s.gold=999;__firebaseTest.cloud={payload:JSON.stringify(s),revision:__firebaseTest.cloud.revision+1};WandererGame.recordActive(1000);});
 await page.clock.fastForward(31000);await page.locator('#downloadCloud').waitFor();assert.equal((await snapshot()).gold,0);assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),999);
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
 // A normal refresh restores the same account without an Account dialog and preserves its current tab.
 await page.locator('[data-nav="forge"]').click();
 assert.equal(await page.locator('[data-nav="forge"]').getAttribute('class'),'active');
 await page.evaluate(()=>sessionStorage.setItem('firebaseRefreshSeed',JSON.stringify({user:__firebaseTest.user,profile:__firebaseTest.profile,cloud:__firebaseTest.cloud})));
 await page.reload();await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_demo-wanderer-dev_alice_v092'&&!document.querySelector('.onlineDialog')&&!document.querySelector('#screen').inert);
 assert.equal(await page.evaluate(()=>__accountDialogOpens),0,'authenticated refresh should not show login dialog');
 assert.ok(await page.locator('[data-nav="forge"]').evaluate(el=>el.classList.contains('active')),'remember Forge after refresh');
 await account();assert.match(await page.locator('.onlineDialog').innerText(),/alice_1/);assert.equal(await page.locator('#nickname,#createProfile,#backups,#exportSave').count(),0);assert.equal((await snapshot()).gold,999);await close();
 // A second account starts fresh, without copying the first account or legacy slot.
 await account();await page.locator('#googleSignOut').click();
 await page.evaluate(async()=>{__firebaseTest.user={uid:'bob'};__firebaseTest.profile={nickname:'bob',characterId:'ranger'};__firebaseTest.cloud=null;await __firebaseTest.restore();});
 await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_demo-wanderer-dev_bob_v092');assert.equal((await snapshot()).gold,0);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wanderer_account_demo-wanderer-dev_alice_v092')).gold),999);
 // A new session (not an ignored duplicate auth event) should restore newer
 // cloud progress when the local copy is unchanged.
 await page.evaluate(()=>{const s=JSON.parse(__firebaseTest.cloud.payload);s.gold=777;__firebaseTest.cloud={payload:JSON.stringify(s),revision:__firebaseTest.cloud.revision+1};
  sessionStorage.setItem('firebaseRefreshSeed',JSON.stringify({user:__firebaseTest.user,profile:__firebaseTest.profile,cloud:__firebaseTest.cloud}));
 });
 await page.reload();
 await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_demo-wanderer-dev_bob_v092'&&WandererGame.snapshot().gold===777&&!document.querySelector('.onlineDialog'));
 assert.equal((await snapshot()).gold,777);assert.equal(await page.locator('#uploadLocal').count(),0);
 
 assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('wanderer_backup_'))));
 // The Guest option is removed and cannot initiate anonymous sessions.
 assert.equal(await page.locator('#guestSignIn,.guestNotice').count(),0);
 // Fresh speedrun resets account progress but not identity; failed cloud writes leave local data untouched.
 const previousAttempt=(await snapshot()).onlineProgress.attemptId||'legacy';
 await page.evaluate(()=>{
  const s=WandererGame.snapshot();
  s.gold=733;s.fragments=111;s.maxDungeon=18;s.chosen=18;s.onlineProgress.deepestCleared=17;
  WandererGame.switchSave(WandererGame.key(),s);
 });
 await account();await page.locator('#resetProgress').click();
 assert.match(await page.locator('.onlineDialog').innerText(),/All playable progress/);
 await page.locator('#cancelReset').click();assert.equal((await snapshot()).gold,733);
 await page.locator('#resetProgress').click();await page.locator('#resetConfirmation').fill('WRONG');await page.locator('#confirmReset').click();
 assert.match(await page.locator('.onlineDialog .onlineError').innerText(),/Type RESET/);
 assert.equal((await snapshot()).gold,733);
 await page.locator('#resetConfirmation').fill('RESET');
 await page.evaluate(()=>{__firebaseTest.offline=true});
 await page.locator('#confirmReset').click();
 assert.match(await page.locator('.onlineDialog .onlineError').innerText(),/unavailable/);
 assert.equal((await snapshot()).gold,733,'cloud error must not destroy progress');
 await page.evaluate(()=>{__firebaseTest.offline=false});
 await page.locator('#confirmReset').click();
 await page.waitForFunction(()=>!document.querySelector('.onlineDialog')&&WandererGame.snapshot().gold===0);
 const reset=await snapshot();
 assert.equal(reset.maxDungeon,1);assert.equal(reset.fragments,0);assert.equal(reset.runes.length,0);
 assert.equal(reset.onlineProgress.deepestCleared,0);assert.equal(reset.onlineProgress.activeMs,0);
 assert.notEqual(reset.onlineProgress.attemptId,previousAttempt);
 assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),0,'cloud reset committed');
 assert.equal(await page.locator('[data-online-action="account"]').innerText(),'bob','nickname preserved');

 assert.deepEqual(errors,[]);
 console.log(`PASS ${width}px: login required, migration, cosmetics, automatic sync/rankings, conflicts, offline retry, sign-out and return`);await page.close();
 }}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
