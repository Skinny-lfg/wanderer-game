'use strict';
// Synthetic local fixture: verify a full Bag blocks Realm entry but still permits extraction.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot));
const fixture=`phase1Init();render();globalThis.__bag={
 win:()=>{state.run.enemy.hp=0;phase1WaveWon();},
 runStatus:()=>state.run?.status||phase1Controller.state.stage,
 fill:()=>{state.valuables=[];phase3LootIds=new Set();for(let i=0;i<PHASE3_BAG_CAPACITY;i++){const item={kind:'valuable',id:'full-bag-'+i,name:'Synthetic treasure',worth:1,image:'assets/loot/treasure_gem_pouch.webp'};state.valuables.push(item);phase3LootIds.add(item.id);}renderPhase1();},
 outcome:()=>({stage:phase1Controller.state.stage,active:!!state.run,bag:phase3BagItems().length,capacity:PHASE3_BAG_CAPACITY,treasures:state.valuables.length,outcome:phase5Results.summary?.outcome,retainedTreasures:phase5Results.summary?.treasuresKept?.length,runes:state.runes.length})
};`;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://fixture');
 const file=path.resolve(root,'.'+url.pathname);
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture+'const phase3RestoredScroll=null;'));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(error,body)=>{res.statusCode=error?404:200;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(error?'Missing':body);});
});

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const [width,height] of [[390,844],[1280,800]]){
   const context=await browser.newContext({viewport:{width,height}});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1');
   await page.locator('[data-phase3-nav="phase1"]').click();
   await page.locator('[data-phase1-expedition="1"]').first().click();
   await page.locator('[data-phase2-initial="blood"]').click();
   for(let wave=0;wave<5&&await page.evaluate(()=>__bag.runStatus())==='fight';wave++){
    await page.evaluate(()=>__bag.win());
    await page.waitForTimeout(700);
   }
   await page.locator('dialog[data-realm-passive]').waitFor({state:'visible'});
   await page.locator('dialog [data-popup-passive]').first().click();
   await page.locator('#phase5ExitRealm').click();
   await page.evaluate(()=>__bag.fill());
   assert.equal(await page.locator('.phase3Routes .phase3BagFullNotice').isVisible(),true,'full Bag warning appears at Realm selection');
   assert.equal(await page.locator('#phase2EnterRealm').isDisabled(),true,'full Bag blocks entering another Realm');
   assert.equal(await page.locator('#phase4Extract').isEnabled(),true,'full Bag still permits extraction');
   const full=await page.evaluate(()=>__bag.outcome());
   assert.equal(full.bag,full.capacity,'fixture fills every Bag slot');
   await page.locator('#phase4Extract').click();
   await page.locator('dialog[open] [data-confirm]').click();
   const state=await page.evaluate(()=>__bag.outcome());
   assert.equal(state.active,false);
   assert.equal(state.treasures,state.capacity,'all valuable items remain in the saved profile after extraction');
   assert.equal(state.outcome,'extracted');
   assert.equal(state.retainedTreasures,state.capacity,'extraction summary records every treasure as retained');
   assert.equal(state.runes,0,'extraction cannot grant a boss Rune');
   assert.deepEqual(errors,[]);
   console.log('PASS full-Bag extraction '+width+'x'+height+': blocked entry, retained Bag, no Rune, no page errors');
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
