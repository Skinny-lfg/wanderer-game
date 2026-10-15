// Start python3 -m http.server 8010 before running. Firebase boundary is mocked; live OAuth is not tested here.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8010';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [1440,390,320]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/online/firebase-client.mjs',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/firebase-client.mjs','utf8')}));
 await page.addInitScript(()=>{
  if(localStorage.getItem('testSeeded'))return;
  const slots={helm:null,amulet:null,armor:null,gloves:null,weapon:{id:'heavy',slot:'weapon',subtype:'Two-Handed',name:'Legacy heavy',tier:10,rarity:'Epic',atk:99999,agi:9999,def:1000},offhand:null,ring1:null,ring2:null,boots:null};
  localStorage.setItem('wanderer_browser_proto_v01',JSON.stringify({resetVersion:'older-main-version',maxDungeon:12,chosen:1,stashCapacity:80,gold:111,fragments:222,stash:[],equip:slots,valuables:[],offersByLevel:{},merchant:null,run:null}));localStorage.setItem('testSeeded','yes');
 });
 await page.goto(URL);await page.waitForFunction(()=>!!globalThis.__firebaseTest);
 const snapshot=()=>page.evaluate(()=>WandererGame.snapshot());
 assert.equal((await snapshot()).gold,111);assert.equal((await snapshot()).stashCapacity,80);assert.equal((await snapshot()).equip.weapon.id,'heavy');
 const account=()=>page.locator('[data-online-action="account"]').click();const close=()=>page.locator('.onlineDialog [data-close]').click();
 await account();assert.equal(await page.locator('[data-character]').count(),5);
 for(const id of ['wanderer','ranger','knight','spellblade','duelist']){await page.locator(`[data-character="${id}"]`).click();await page.locator('#saveCharacter').click();assert.equal((await snapshot()).characterId,id);assert.equal((await snapshot()).equip.weapon.atk,99999);}
 await page.locator('[data-character="knight"]').click();await page.locator('#saveCharacter').click();
 assert.ok(await page.locator('.tavernAvatar').getAttribute('src').then(x=>x.includes('knight')));
 await page.locator('#googleSignIn').click();await page.locator('#nickname').waitFor();await page.locator('#nickname').fill('taken');await page.locator('#createProfile').click();assert.match(await page.locator('.onlineError').innerText(),/taken/);
 await page.locator('#nickname').fill('Alice_1');await page.locator('#createProfile').click();await page.locator('#reviewCloud').waitFor();assert.equal((await snapshot()).gold,111);assert.equal(await page.evaluate(()=>__firebaseTest.writes),0);
 await page.locator('#reviewCloud').click();assert.ok(await page.locator('#downloadCloud').isDisabled());await close();assert.equal((await snapshot()).gold,111);
 await account();await page.locator('#reviewCloud').click();await page.locator('#uploadLocal').click();await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_alice');assert.equal((await snapshot()).gold,111);assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),111);
 // Explicit sync + revision conflict: never overwrite remote progress automatically.
 await page.evaluate(()=>{const s=JSON.parse(__firebaseTest.cloud.payload);s.gold=999;__firebaseTest.cloud={payload:JSON.stringify(s),revision:__firebaseTest.cloud.revision+1};WandererGame.recordActive(1000)});
 await account();await page.locator('#syncNow').click();assert.match(await page.locator('.onlineError').innerText(),/Another device/);assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).gold),999);assert.equal((await snapshot()).gold,111);
 await page.locator('#reviewCloud').click();await page.locator('#downloadCloud').click();await page.waitForFunction(()=>WandererGame.snapshot().gold===999);
 await account();await page.locator('[data-character="spellblade"]').click();await page.locator('#saveCharacter').click();await page.locator('#syncNow').click();assert.equal(await page.evaluate(()=>JSON.parse(__firebaseTest.cloud.payload).characterId),'spellblade');await close();
 await page.locator('[data-nav="equipment"]').click();assert.match(await page.locator('.paper .model').getAttribute('src'),/spellblade/);
 await page.locator('[data-nav="dungeons"]').click();await page.locator('#enter').click();await page.locator('[data-confirm]').click();assert.match(await page.locator('.combatant img').first().getAttribute('src'),/spellblade/);
 await account();await page.locator('#googleSignOut').click();assert.match(await page.locator('.onlineError').innerText(),/expedition/);await close();await page.waitForFunction(()=>!document.querySelector('#leave')?.disabled);await page.locator('#leave').click();
 await account();await page.locator('#syncNow').click();await page.locator('#googleSignOut').click();await page.waitForFunction(()=>WandererGame.key()==='wanderer_browser_proto_v01');assert.equal((await snapshot()).gold,111);assert.equal((await snapshot()).characterId,'knight');
 await page.locator('#googleSignIn').click();await page.locator('#reviewCloud').waitFor();await page.locator('#reviewCloud').click();await page.locator('#uploadLocal').click();await page.waitForFunction(()=>WandererGame.key()==='wanderer_account_alice');
 await page.locator('[data-online-action="leaderboard"]').click();await page.locator('.rankingList').waitFor();assert.match(await page.locator('.experimental').innerText(),/UNVERIFIED/);await page.locator('#ranking').selectOption('first');await page.locator('.rankingList').waitFor();assert.match(await page.locator('#metricDescription').innerText(),/server receipt/);await page.locator('#ranking').selectOption('fastest');await page.locator('.rankingList').waitFor();assert.match(await page.locator('.rankingList').innerText(),/1m 0s/);await page.locator('#publishResults').click();await page.waitForFunction(()=>__firebaseTest.shared===1);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await close();
 // Offline write fails safely; retries must explicitly review both saves.
 await page.evaluate(()=>{__firebaseTest.offline=true;WandererGame.recordActive(1000)});await account();await page.locator('#syncNow').click();assert.match(await page.locator('.onlineError').innerText(),/unavailable/);assert.ok((await snapshot()).gold>=999);
 await page.evaluate(()=>__firebaseTest.offline=false);await page.locator('#reviewCloud').click();await page.locator('#uploadLocal').click();await page.waitForFunction(()=>!document.querySelector('.onlineDialog'));
 assert.equal((await snapshot()).equip.weapon.id,'heavy');
 // Explicit import and recovery of a protected stale-tab save.
 const importPayload={...(await snapshot()),gold:77};const cloudBefore=await page.evaluate(()=>__firebaseTest.cloud.payload);
 await account();await page.locator('#importSave').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(importPayload))});await page.locator('#confirmImport').waitFor();assert.notEqual((await snapshot()).gold,77);await page.locator('#confirmImport').click();assert.equal((await snapshot()).gold,77);assert.equal(await page.evaluate(()=>__firebaseTest.cloud.payload),cloudBefore);
 await page.evaluate(()=>{const key=WandererGame.key(),value=JSON.parse(localStorage.getItem(key));value.gold=88;localStorage.setItem(key,JSON.stringify(value));WandererGame.recordActive(1000)});assert.ok(await page.evaluate(()=>WandererGame.blocked()));
 await account();await page.locator('#importSave').setInputFiles({name:'recovery.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(importPayload))});await page.locator('#confirmImport').click();assert.equal((await snapshot()).gold,77);assert.ok(!(await page.evaluate(()=>WandererGame.blocked())));assert.ok(!(await page.locator('#screen').evaluate(el=>el.inert)));assert.equal(await page.evaluate(()=>__firebaseTest.cloud.payload),cloudBefore);
 assert.ok(await page.evaluate(()=>Object.keys(localStorage).some(k=>k.startsWith('wanderer_backup_'))));assert.deepEqual(errors,[]);
 console.log(`PASS ${width}px: legacy saves, five cosmetics, profile collision, explicit migration, stale revision, offline, guest/account isolation, combat, character rendering and three unverified boards`);
 await page.close();
 }}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
