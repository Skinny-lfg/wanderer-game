// Browser regression: shared Inventory/Between Realms equipment popup size.
// Synthetic tab-local state only; never signs in or touches actual player saves.
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot),'Missing preview bootstrap');
const fixture=`phase1Init();
const testBelt=makeItem(1,'belt',null,'loot','Leather','Rare'),testRing=makeItem(1,'ring1',null,'loot','Ring','Rare');
state.stash.push(testBelt,testRing);
phase3LootIds.add(testBelt.id);phase3LootIds.add(testRing.id);
globalThis.__equipPopupTest={
 ids:()=>({belt:testBelt.id,ring:testRing.id}),
 inventory:()=>{view='equipment';renderStash();},
 between:()=>{
  const g=phase1Controller.state;
  g.stage='choice';g.initialFamily='blood';g.planeIndex=2;
  g.families=['blood'];g.rewardPending=false;
  phase1Draft=null;phase4Resume=null;phase5Results.review=null;state.run=null;
  phase3BetweenTab='equipment';renderPhase1();
 },
 equipped:()=>{
  state.stash=state.stash.filter(item=>item.id!==testBelt.id);
  state.equip.belt=testBelt;phase3LootIds.delete(testBelt.id);renderPhase1();
 }
};
render();
const phase3RestoredScroll=null;`;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.gif':'image/gif'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),relative=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1)),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 try{
  const data=relative==='index.html'?Buffer.from(source.replace(boot,fixture)):fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1');
   const ids=await page.evaluate(()=>__equipPopupTest.ids());
   const measure=async(type,standard=true)=>{
    const dialog=page.locator('dialog.itemDialog.equipmentItemDialog[open]');
    await dialog.waitFor();
    const data=await dialog.evaluate(d=>{
     const box=d.getBoundingClientRect(),c=getComputedStyle(d);
     return {width:box.width,height:box.height,maxHeight:c.maxHeight,scroll:c.overflowY,
      horizontalOverflow:d.scrollWidth>d.clientWidth+2,
      hasStandard:d.classList.contains('equipmentStandardDialog')};
    });
    assert.equal(data.hasStandard,standard,type+' dialog size class');
    assert(data.height<=Math.min(900*(width<=700?.82:.72),width<=700?680:600)+2,type+' exceeds bounded Inventory height '+JSON.stringify(data));
    assert.equal(data.horizontalOverflow,false,type+' has unwanted horizontal scroll');
    await dialog.locator('[data-close]').click();
    return data;
   };
   await page.evaluate(()=>__equipPopupTest.inventory());
   await page.locator('[data-item="'+ids.belt+'"]').click();
   const inventoryBelt=await measure('Inventory belt');
   await page.locator('[data-item="'+ids.ring+'"]').click();
   const inventoryRing=await measure('Inventory ring',false);
   await page.evaluate(()=>__equipPopupTest.between());
   const details=page.locator('.phase3BetweenBag');
   if(await details.count()&&!(await details.evaluate(d=>d.open)))await details.locator('summary').click();
   await page.locator('[data-phase3-loot="'+ids.belt+'"]').click();
   const betweenBelt=await measure('Between Realms bag belt');
   await page.locator('[data-phase3-loot="'+ids.ring+'"]').click();
   const betweenRing=await measure('Between Realms bag ring',false);
   assert(Math.abs(inventoryBelt.width-betweenBelt.width)<2,'Bag and Inventory belt popup widths differ');
   assert(Math.abs(inventoryRing.width-betweenRing.width)<2,'Bag and Inventory ring popup widths differ');
   await page.evaluate(()=>__equipPopupTest.equipped());
   await page.locator('.phase3BetweenEquipment .paper [data-eqslot="belt"]').click();
   const equipped=await measure('Between Realms equipped belt');
   assert(Math.abs(inventoryBelt.width-equipped.width)<2,'Equipped and Inventory popup widths differ');
   assert.deepEqual(errors,[],'browser errors');
   console.log('PASS Between Realms/Inventory equipment popup sizes '+width+'px');
   await context.close();
  }
 }finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
