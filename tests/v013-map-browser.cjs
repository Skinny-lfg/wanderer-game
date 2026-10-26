/* Standalone v0.13 map browser test. This is NOT a production save or game test. */
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(req.url.split('?')[0]);
 const filename=path.resolve(root,'.'+pathname);
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 fs.readFile(filename,(err,bytes)=>{res.writeHead(err?404:200,{'Content-Type':filename.endsWith('.js')?'application/javascript':'text/html'});res.end(err?'Missing':bytes);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [320,390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   const page=await ctx.newPage(),errors=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>{if(route.request().url().startsWith(base))route.continue();else{external.push(route.request().url());route.abort();}});
   await page.addInitScript(()=>localStorage.setItem('wanderer-game-sentinel','PRESERVE'));
   await page.goto(base+'/experiments/v013-map-prototype.html');
   assert.equal(await page.locator('.node').count(),41,'41 map nodes');
   assert.equal(await page.locator('.node.available').count(),3,'three initial branches');
   assert.equal(await page.locator('.node[data-kind="boss"]').count(),1);
   assert.equal(await page.locator('.node[data-kind="elite"]').count(),6,'two elite layers x three variants');
   let steps=0;
   while(await page.locator('.node.available').count()){
     await page.locator('.node.available').first().click();
     steps++;
     if(steps>14)throw Error('Map never reached boss');
   }
   assert.equal(steps,14,'14 transitions from initial R1 through boss');
   assert.equal(await page.locator('.node.current').getAttribute('data-id'),'r15n0');
   assert.match(await page.locator('#message').innerText(),/Boss alcançado/);
   await page.locator('#reset').click();
   assert.equal(await page.locator('.node.current').getAttribute('data-id'),'r1n0');
   await page.locator('#seed').fill('27');
   await page.locator('#regenerate').click();
   assert.equal(await page.locator('.node.available').count(),3);
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer-game-sentinel')),'PRESERVE');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no horizontal overflow at '+width+'px');
   assert.deepEqual(external,[],'must not make network calls outside local isolated prototype');
   assert.deepEqual(errors,[],'no browser exceptions '+width+'px');
   console.log('PASS v0.13 isolated map browser '+width+'px, seed/restart/15 Realms');
   await ctx.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});