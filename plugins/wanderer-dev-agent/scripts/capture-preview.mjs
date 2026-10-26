import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createPrivatePreviewServer} from '../../../preview/private-server.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const require=createRequire(path.join(root,'package.json'));
const {chromium}=require('playwright');
const outDir=path.join(root,'test-results','wanderer-dev-agent');
await mkdir(outDir,{recursive:true});
const username='synthetic-'+randomBytes(6).toString('hex');
const password=randomBytes(24).toString('base64url');
const server=createPrivatePreviewServer({root,username,password,allowLocalHttp:true});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const reports=[];
try{
 for(const [name,width,height] of [['mobile',390,844],['desktop',1280,800]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),pageErrors=[],failedResponses=[],externalRequests=[];
  await context.route('**/*',route=>{const url=route.request().url();if(url===origin||url.startsWith(origin+'/'))return route.continue();externalRequests.push(url);return route.abort();});
  page.on('pageerror',e=>pageErrors.push(e.message));
  page.on('response',response=>{if(response.status()>=400)failedResponses.push(`${response.status()} ${response.url()}`);});
  await page.goto(origin,{waitUntil:'domcontentloaded'});
  await page.locator('#user').fill(username);await page.locator('#pass').fill(password);
  await page.getByRole('button',{name:'Enter Playtest'}).click();
  await page.waitForFunction(()=>globalThis.WandererGame?.validationStatus().ready,{timeout:30000});
  await page.locator('[data-phase1-expedition="1"]').first().waitFor({state:'visible'});
  await page.screenshot({path:path.join(outDir,`camp-${name}.png`),fullPage:true});
  await page.locator('[data-phase1-expedition="1"]').first().click();
  await page.locator('[data-phase2-initial="blood"]').waitFor({state:'visible'});
  await page.locator('[data-phase2-initial="blood"]').click();
  await page.locator('#enemyPortrait').waitFor({state:'visible',timeout:30000});
  await page.waitForFunction(()=>globalThis.WandererGame?.snapshot().run?.status==='fight',{timeout:30000});
  await page.screenshot({path:path.join(outDir,`combat-${name}.png`),fullPage:true});
  reports.push({viewport:name,width,height,screenshots:[`camp-${name}.png`,`combat-${name}.png`],pageErrors,failedResponses,externalRequests});
  await context.close();
 }
 const hasErrors=reports.some(r=>r.pageErrors.length||r.failedResponses.length||r.externalRequests.length);
 process.stdout.write(JSON.stringify({ok:!hasErrors,mode:'private preview; synthetic browser credentials; no Firebase or real-save access',output:outDir,reports},null,2)+'\n');
 if(hasErrors)process.exitCode=1;
}finally{
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
