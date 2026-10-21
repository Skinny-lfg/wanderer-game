'use strict';
// Route the local app entirely inside Chromium; no real account, save or TCP listener.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const boot='phase1Init();render();';
const fixture=`phase1Init();globalThis.__c3={
 setup(){state.valuables=WandererV012Treasures.CATALOG.map((t,i)=>({...t,id:'ui-'+i,kind:'valuable',treasureType:t.id,tier:1}));renderStash();},
 count(){return state.valuables.length;},gold(){return state.gold;},
 summary(){const t=({...WandererV012Treasures.CATALOG[2],id:'summary-treasure',kind:'valuable',treasureType:'golden-lion-statuette',tier:1});phase5Results.review='summary';phase5Results.complete=true;phase5Results.summary={level:1,outcome:'extracted',realms:1,families:['blood'],picks:[],seconds:1,gold:0,fragments:0,kept:[],lost:[],discarded:[],treasuresKept:[t],treasuresLost:[],runeTier:null};phase5RenderResult();}
};render();`;
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='wanderer.test')return route.abort();
    const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(root+path.sep))return route.fulfill({status:403});
    try{const body=file.endsWith('/index.html')?fs.readFileSync(file,'utf8').replace(boot,fixture):fs.readFileSync(file);await route.fulfill({body,contentType:mime[path.extname(file)]||'application/octet-stream'});}catch{return route.fulfill({status:404});}
   });
   await page.goto('http://wanderer.test/?expeditionPhase1=1');
   if(errors.length)throw Error('App bootstrap: '+errors.join('; '));
   await page.evaluate(()=>__c3.setup());
   assert.equal(await page.locator('.inventoryValuables .c3TreasureImg').count(),6);
   assert(await page.locator('.inventoryValuables .c3TreasureImg').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
   assert(await page.evaluate(()=>document.body.scrollWidth<=innerWidth+1));
   await page.locator('#phase6SellAllValuables').click();
   await page.locator('dialog [data-confirm]').click();
   assert.equal(await page.evaluate(()=>__c3.count()),0);
   assert.equal(await page.evaluate(()=>__c3.gold()),175);
   await page.evaluate(()=>__c3.summary());
   assert.equal(await page.locator('.phase5Result .c3TreasureResult img').count(),1);
   assert(await page.locator('.phase5Result .c3TreasureResult img').evaluate(i=>i.complete&&i.naturalWidth>0));
   assert(await page.evaluate(()=>document.body.scrollWidth<=innerWidth+1));
   assert.deepEqual(errors,[]);
   await page.close();
   console.log('PASS C.3 treasure UI '+width+'px: images, Stash, Sell All, extraction summary, no horizontal scroll');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
