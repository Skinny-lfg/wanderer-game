'use strict';
// Actual isolated v0.13 preview browser smoke; never uses the retired talent UI.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
 const out=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
 const prefix='Isolated automatic RPG preview: ';
 assert(out.startsWith(prefix));
 const root=out.slice(prefix.length);
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1'),name=decodeURIComponent(u.pathname);
  if(name.includes('..'))return res.writeHead(400).end();
  const file=path.join(root,name==='/'?'index.html':name.slice(1));
  fs.readFile(file,(err,bytes)=>{
   if(err)return res.writeHead(404).end();
   const ext=path.extname(file);
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[ext]||'application/octet-stream');
   res.end(bytes);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  const launch={headless:true};
  if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
  browser=await chromium.launch(launch);
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load'});
  assert.equal(await page.evaluate(()=>WandererAutomaticTalents.NODES.length),343);
  assert.equal(await page.evaluate(()=>typeof WandererAutomaticTalents.migrate),'undefined');
  assert.equal(await page.evaluate(()=>typeof WandererAutomaticTalents.allocateAttribute),'undefined');
  await page.getByRole('button',{name:'Talents',exact:true}).click();
  const iframe=page.locator('iframe[title="Talent tree"]');
  await iframe.waitFor({state:'visible'});
  const preview=page.frameLocator('iframe[title="Talent tree"]');
  await preview.locator('body').waitFor({state:'visible'});
  const metrics=await page.evaluate(()=>({
   currentTalents:WandererGame.snapshot().automaticTalents.nodes.length,
   hasV15API:typeof WandererTreeAPI?.allocate==='function'&&typeof WandererTreeAPI?.reset==='function',
   oldAttributePanel:!!document.querySelector('[data-auto-attribute]'),
   oldTalentCanvas:!!document.querySelector('.talentGraphViewport')
  }));
  assert.equal(metrics.currentTalents,0);
  assert.equal(metrics.hasV15API,true);
  assert.equal(metrics.oldAttributePanel,false);
  assert.equal(metrics.oldTalentCanvas,false);
  assert.deepEqual(errors,[]);
  console.log('CLEAN_SHEET_BROWSER='+JSON.stringify({...metrics,errors,iframeVisible:true}));
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
