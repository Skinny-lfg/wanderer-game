// Real private hosting wrapper, synthetic credentials/storage, loopback requests only.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const {createPrivatePreviewServer}=await import('../preview/private-server.mjs');
 const server=createPrivatePreviewServer({username:'synthetic-tester',password:'synthetic-preview-password-only',allowLocalHttp:true});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await context.addInitScript(()=>localStorage.setItem('wanderer_browser_proto_v01','CLASSIC_UNTOUCHED'));
  const denied=await context.request.get(base+'/online/v012-save.js',{maxRedirects:0});assert.equal(denied.status(),303);
  await page.goto(base);await page.locator('#user').fill('synthetic-tester');await page.locator('#pass').fill('synthetic-preview-password-only');
  await page.getByRole('button',{name:'Enter Playtest'}).click();await page.waitForFunction(()=>globalThis.WandererGame?.validationStatus().ready);
  assert.equal(await page.locator('[data-phase1-expedition="1"]').count(),1);
  await page.locator('[data-phase1-expedition="1"]').click();assert.equal(await page.locator('[data-phase2-initial]').count(),6);
  await page.locator('#initialBack').click();await page.locator('[data-phase1-expedition="1"]').click();await page.locator('[data-phase2-initial="blood"]').click();
  await page.locator('#enemyPortrait').waitFor();assert.equal(await page.evaluate(()=>WandererGame.snapshot().run.status),'fight');
  assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'CLASSIC_UNTOUCHED');
  assert(!requests.some(u=>u.includes('/online/app.mjs')||u.includes('firebase-sdk')));assert.deepEqual(errors,[]);
  console.log('PASS private hosting '+width+'px: access gate, CSP/native boot, six affinities, Back, combat and isolated storage');await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
