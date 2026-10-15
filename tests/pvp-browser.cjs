const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.WANDERER_TEST_URL||'http://127.0.0.1:8012';
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{for(const width of [1440,390,320]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/online/firebase-client.mjs*',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('tests/fixtures/firebase-client.mjs','utf8')}));
 await page.goto(URL);await page.locator('#googleSignIn').click();await page.locator('#nickname').fill('alice_1');await page.locator('#createProfile').click();await page.waitForFunction(()=>!document.querySelector('.onlineDialog'));
 const board=()=>page.locator('[data-online-action="leaderboard"]').click();await board();await page.locator('[data-player="test"]').click();await page.locator('#practiceAttack').waitFor();
 assert.match(await page.locator('.publicGear').innerText(),/Opponent Sword/);assert.match(await page.locator('.onlineDialog').innerText(),/Poison Set/);assert.equal(await page.locator('.statsGrid').count(),1);
 const avatarBox=await page.locator('.playerHeading img').boundingBox();assert.equal(avatarBox.width,width<=650?56:64);assert.equal(avatarBox.height,width<=650?56:64);
 for(const icon of await page.locator('.publicGearItem img').all()){const box=await icon.boundingBox();assert.equal(box.width,width<=650?40:48);assert.equal(box.height,width<=650?40:48);}
 const before=await page.evaluate(()=>({gold:WandererGame.snapshot().gold,equip:WandererGame.snapshot().equip,stash:WandererGame.snapshot().stash}));
 await page.locator('#practiceAttack').click();assert.match(await page.locator('.onlineDialog').innerText(),/No Gold transferred/);assert.ok(await page.locator('.duelLog li').count()>0);
 assert.deepEqual(await page.evaluate(()=>({gold:WandererGame.snapshot().gold,equip:WandererGame.snapshot().equip,stash:WandererGame.snapshot().stash})),before);
 await page.locator('#returnToPlayer').click();await page.locator('#backToLeaderboard').click();await page.locator('#playerNickname').fill('OUTSIDER');await page.locator('#playerSearch button').click();await page.locator('#practiceAttack').waitFor();assert.equal(await page.locator('#onlineDialogTitle').innerText(),'outsider');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`/tmp/wanderer-pvp-${width}.png`});
 await page.locator('#backToLeaderboard').click();await page.locator('#playerNickname').fill('nobody');await page.locator('#playerSearch button').click();assert.match(await page.locator('.onlineDialog .onlineError').innerText(),/not found/);
 await page.locator('#playerNickname').fill('alice_1');await page.locator('#playerSearch button').click();await page.locator('#practiceAttack').waitFor();assert.ok(await page.locator('#practiceAttack').isDisabled());
 await page.locator('.onlineDialog [data-close]').click();await page.locator('[data-nav="dungeons"]').click();await page.locator('#enter').click();await page.locator('[data-confirm]').click();await board();await page.locator('[data-player="test"]').click();await page.locator('#practiceAttack').click();assert.match(await page.locator('.onlineDialog .onlineError').innerText(),/expedition/);
 assert.deepEqual(errors,[]);console.log(`PASS ${width}px: player profiles, gear/stats/sets, exact nickname search beyond leaderboard, practice battle, self-attack blocked, unchanged saves`);await page.close();
 }}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
