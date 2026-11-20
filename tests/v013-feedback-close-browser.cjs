'use strict';
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const source=fs.readFileSync(path.resolve(__dirname,'../online/v012-feedback.mjs'),'utf8');
const html=`<!doctype html><html><body>
<div id="onlineBar"><button id="menuToggle" aria-expanded="false">Menu</button>
<button data-online-action="feedback">Feedback & Bugs</button></div>
<script>
window.__feedbackCalls=[];
window.WandererFeedbackContext=()=>({appVersion:'0.13.0',screen:'Camp',maxDungeon:3,characterId:'test'});
</script><script type="module" src="/online/v012-feedback.mjs"></script>
</body></html>`;
const backend=`export async function createBackend(){
 return {
  watchAuth(callback){queueMicrotask(()=>callback(window.__feedbackAnonymous?{isAnonymous:true}:{uid:'audit-user',isAnonymous:false}));return ()=>{};},
  async submitV012Feedback(payload){
   window.__feedbackCalls.push(payload);
   if(window.__feedbackReject)throw Object.assign(new Error('Rejected'),{code:'permission-denied'});
  }
 };
}`;
const build=`export const buildCommit='audit-test';`;
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const files={'/': ['text/html',html],'/online/v012-feedback.mjs':['text/javascript',source],
 '/online/firebase-client.mjs':['text/javascript',backend],
 '/online/v012-build-info.mjs':['text/javascript',build]};
 const entry=files[pathname];
 res.setHeader('Cache-Control','no-store');
 if(!entry){res.writeHead(404);res.end('Not found');return;}
 res.setHeader('Content-Type',entry[0]+'; charset=utf-8');
 res.end(entry[1]);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const open=()=>page.locator('[data-online-action="feedback"]').click();
 const dialog=page.locator('dialog.wandererFeedbackDialog');
 try{
  await page.goto('http://127.0.0.1:'+port+'/');
  await open();await dialog.waitFor({state:'visible'});
  assert.equal(await dialog.count(),1,'opens exactly one dialog');
  await dialog.locator('[data-close-feedback]').click();
  assert.equal(await dialog.count(),0,'clicking Close removes dialog immediately');
  for(let i=0;i<20;i++){
   await open();await dialog.waitFor({state:'visible'});
   await dialog.locator('[data-close-feedback]').click();
   assert.equal(await dialog.count(),0,'repeated close '+i);
  }
  await open();await dialog.waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached'});
  await open();await dialog.waitFor({state:'visible'});
  await dialog.locator('textarea[name="description"]').fill('Confirmed real browser report flow.');
  await dialog.locator('textarea[name="steps"]').fill('Open Camp and submit feedback.');
  await dialog.locator('[data-send-feedback]').click();
  await page.waitForFunction(()=>document.querySelector('#wandererFeedbackStatus')?.dataset.status==='success');
  assert.match(await dialog.locator('#wandererFeedbackStatus').innerText(),/sent successfully/i);
  const calls=await page.evaluate(()=>window.__feedbackCalls);
  assert.equal(calls.length,1,'submitted exactly once');
  assert.equal(calls[0].category,'bug');
  assert.equal(calls[0].screen,'Camp');
  await dialog.locator('[data-close-feedback]').click();
  assert.equal(await dialog.count(),0,'successful report can close immediately');
  await page.evaluate(()=>window.__feedbackAnonymous=true);
  await open();await dialog.waitFor({state:'visible'});
  await dialog.locator('textarea[name="description"]').fill('Anonymous reports must be refused.');
  await dialog.locator('[data-send-feedback]').click();
  await page.waitForFunction(()=>document.querySelector('#wandererFeedbackStatus')?.dataset.status==='error');
  assert.match(await dialog.locator('#wandererFeedbackStatus').innerText(),/sign in first/i);
  assert.equal((await page.evaluate(()=>window.__feedbackCalls)).length,1,'anonymous cannot submit');
  await dialog.locator('[data-close-feedback]').click();assert.equal(await dialog.count(),0);
  assert.deepEqual(errors,[],'no browser JS errors');
  console.log('V013_FEEDBACK_CLOSE_BROWSER_PASS: repeated-click=21 escape=1 submit=1 anonymous=blocked');
 }finally{await page.close();await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
