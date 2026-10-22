'use strict';
// Merchant/save hotfix regression. All writes use a fresh validationSlot in an isolated browser context.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();render();';assert(source.includes(boot));
const fixture=`phase1Init();render();globalThis.__ui4d={
 payload:()=>JSON.parse(localStorage.getItem(WandererGame.validationStatus().key)),
 stock:()=>state.merchant?.stock.map(item=>({id:item.id,slot:item.slot,goldPrice:item.goldPrice}))||[],
 status:()=>WandererGame.validationStatus(),
 legacyMerchant:()=>{view='merchant';render();},
 funds:()=>{state.gold=10000;save();render();}
};`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}let body;try{body=fs.readFileSync(file);}catch{res.writeHead(404);return res.end('Not found');}if(url.pathname==='/')body=Buffer.from(source.replace(boot,fixture));res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);});
const categorySlots={weapons:['weapon','offhand'],armor:['helm','armor','gloves','boots','belt'],accessories:['ring1','ring2','amulet']};
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  const url='http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=ui4d-merchant';
  await page.goto(url);await page.waitForFunction(()=>window.WandererGame?.validationStatus().ready);
  const before=await page.evaluate(()=>__ui4d.payload());assert.equal(before.profile.merchant,null);
  // The legacy Merchant route previously bypassed the category data filter and showed all 12 offers.
  await page.evaluate(()=>__ui4d.legacyMerchant());await page.waitForFunction(()=>document.querySelectorAll('.merchantCompactCard').length===4);
  const legacyStock=Object.fromEntries((await page.evaluate(()=>__ui4d.stock())).map(item=>[item.id,item.slot]));
  for(const category of ['weapons','armor','accessories']){await page.locator('[data-merchant-category="'+category+'"]').click();const ids=await page.locator('.merchantCompactCard [data-compare]').evaluateAll(buttons=>buttons.map(button=>button.dataset.compare));assert.equal(ids.length,4);assert(ids.every(id=>categorySlots[category].includes(legacyStock[id])));}
  assert.equal(await page.evaluate(()=>__ui4d.status().blocked),false,'12-offer Merchant payload passes isolated validation');
  await page.locator('[data-phase3-nav="city-center"]').click();
  await page.locator('[data-city-tab="merchant"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.merchantCompactCard').length===4);
  let payload=await page.evaluate(()=>__ui4d.payload());assert.equal(payload.profile.merchant.stock.length,12);
  const byId=Object.fromEntries((await page.evaluate(()=>__ui4d.stock())).map(item=>[item.id,item.slot]));
  const afterEntry=payload.profile.merchant.stock;assert.deepEqual(Object.values(categorySlots).map(slots=>afterEntry.filter(item=>slots.includes(item.slot)).length),[4,4,4]);
  const sequence=['weapons','armor','accessories','armor','weapons','accessories','weapons','armor','accessories'];
  for(const category of sequence){
   await page.locator('[data-merchant-category="'+category+'"]').click();const ids=await page.locator('.merchantCompactCard [data-compare]').evaluateAll(buttons=>buttons.map(button=>button.dataset.compare));
   assert.equal(ids.length,4,'four rendered offers in '+category);assert(ids.every(id=>categorySlots[category].includes(byId[id])),'rendered items match '+category+' data filter');
  }
  await page.locator('[data-merchant-category="weapons"]').click();await page.locator('.merchantCompactCard [data-compare]').first().click();assert(await page.locator('dialog .itemComparison').isVisible());await page.locator('dialog [data-close]').click();
  await page.evaluate(()=>__ui4d.funds());await page.locator('.merchantCompactCard [data-buy]').first().click();await page.locator('dialog [data-confirm]').click();
  assert.equal(await page.locator('.merchantCompactCard').count(),4,'buy preserves four displayed offers');
  payload=await page.evaluate(()=>__ui4d.payload());assert.equal(payload.profile.merchant.stock.length,12);assert.equal(payload.profile.stash.length,1);
  await page.locator('[data-phase3-nav="phase1"]').click();assert(await page.locator('.phase3Camp').isVisible(),'return to Camp');
  const beforeReload=await page.evaluate(()=>__ui4d.payload());assert.equal(beforeReload.profile.merchant.stock.length,12);assert.equal(await page.evaluate(()=>__ui4d.status().blocked),false);
  const collision=await context.newPage();await collision.goto(url);await collision.getByRole('alert').waitFor();assert.equal(await collision.evaluate(()=>__ui4d.status().blocked),true);assert.match(await collision.getByRole('alert').innerText(),/already open in another tab/);await collision.close();
  await page.reload();await page.waitForFunction(()=>window.WandererGame?.validationStatus().ready);payload=await page.evaluate(()=>__ui4d.payload());
  assert.equal(payload.profile.merchant.stock.length,12,'merchant pool survives reload');assert.equal(payload.profile.stash.length,1,'purchased gear survives reload');assert.equal(await page.evaluate(()=>__ui4d.status().blocked),false);
  await page.locator('[data-phase3-nav="city-center"]').click();await page.locator('[data-city-tab="merchant"]').click();assert.equal(await page.locator('.merchantCompactCard').count(),4);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS UI.4d Chromium: 4/category, repeated tab switching, compare/buy, City Center/Camp, isolated save/reload and validation-slot collision');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
