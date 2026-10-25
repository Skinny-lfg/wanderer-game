'use strict';
// Local synthetic-only regression for the Forge result dialog; never signs in or loads player saves.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
const compactPatch=" phase3StyleGearDialog(dialog,o);\n dialog?.classList.add('forgeResultDialog');";
assert(source.includes(boot),'Missing v0.12 bootstrap');
assert(source.includes(compactPatch),'Missing compact Forge dialog patch');
const fixture=`phase1Init();render();globalThis.__forgePopupFixture={
 fund:()=>{state.fragments=10000;state.gold=10000;render();},
 snapshot:()=>({fragments:state.fragments,stash:state.stash.length})
};`;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local'),relative=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1)),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 try{
  let body=relative==='index.html'?source.replace(boot,fixture+'const phase3RestoredScroll=null;'):fs.readFileSync(file);
  if(relative==='index.html'&&url.searchParams.get('baseline')==='1')body=Buffer.from(body.toString().replace(compactPatch,'').replace("dialog.scrollTop=0;dialog.querySelector('[data-close]').focus({preventScroll:true});","dialog.querySelector('[data-close]').focus();"));
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const shotDir=path.join(root,'docs/v012-release-audit/screenshots');fs.mkdirSync(shotDir,{recursive:true});
 try{
  for(const [width,height] of [[360,800],[390,844],[430,932],[768,1024],[1280,720]]){
   for(const phase of ['before','after']){
    const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(7000);
    await page.goto('http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1'+(phase==='before'?'&baseline=1':''));
    await page.evaluate(()=>__forgePopupFixture.fund());
    await page.locator('[data-phase3-nav="city-center"]').click();
    await page.locator('[data-city-tab="blacksmith"]').click();
    await page.locator('[data-blacksmith-operation="forge"]').click();
    await page.locator('#craft').waitFor({state:'visible'});
    if(phase==='before'){
     await page.screenshot({path:path.join(shotDir,`forge-result-before-${width}x${height}.png`)});
    }else{
     const before=await page.evaluate(()=>__forgePopupFixture.snapshot());
     await page.locator('#craft').click();
     const dialog=page.locator('dialog.itemDialog.equipmentItemDialog.forgeResultDialog[open]');
     await dialog.waitFor();
     const box=await dialog.evaluate(node=>{
      const r=node.getBoundingClientRect(),style=getComputedStyle(node),image=node.querySelector('.inspectHero img'),ir=image.getBoundingClientRect();
      const heading=node.querySelector('h2').getBoundingClientRect(),viewport=node.getBoundingClientRect();
      return {width:r.width,height:r.height,maxHeight:parseFloat(style.maxHeight),overflowX:style.overflowX,
       imageWidth:ir.width,imageHeight:ir.height,titleVisible:heading.top>=viewport.top&&heading.bottom<=viewport.bottom,
       comparisonCount:node.querySelectorAll('.itemComparison').length,
       hasClose:!!node.querySelector('[data-close]'),hasEquip:!!node.querySelector('[data-equip-crafted]')};
     });
     assert(box.width<=Math.min(640,width-16)+2,'Forge result exceeds compact dialog width: '+JSON.stringify(box));
     assert(box.height<=Math.min(height*(width<=700?.82:.72),width<=700?680:600)+2,'Forge result exceeds bounded height: '+JSON.stringify(box));
     assert.equal(box.overflowX,'hidden','dialog must prevent horizontal page overflow');
     assert(Math.abs(box.imageWidth-box.imageHeight)<=1,'forged item image must remain square: '+JSON.stringify(box));
     assert(box.titleVisible,'result title must be visible at initial scroll position: '+JSON.stringify(box));
     assert.equal(box.comparisonCount,0,'Forge result should avoid a second, expanded equipment comparison');
     assert(box.hasClose&&box.hasEquip,'result should retain close and equip actions');
     await page.screenshot({path:path.join(shotDir,`forge-result-after-${width}x${height}.png`)});
     await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
     const after=await page.evaluate(()=>__forgePopupFixture.snapshot());
     assert.equal(after.stash,before.stash+1,'one click adds exactly one item');
     assert(after.fragments<before.fragments,'one click spends the configured crafting cost');
     assert.deepEqual(errors,[],'browser errors');
    }
    await context.close();
   }
   console.log('PASS Forge result popup '+width+'×'+height);
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
