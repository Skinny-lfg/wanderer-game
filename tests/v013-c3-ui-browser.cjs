'use strict';
// C3: test the real v0.13 preview in Chromium. QA-only state is injected into
// a disposable build, never into the source game, docs or a real cloud account.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const output=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
const prefix='Isolated automatic RPG preview: ';
assert(output.startsWith(prefix),'Only isolated preview builds may be browser-tested');
const root=path.resolve(output.slice(prefix.length));
const entry=path.join(root,'index.html'),boot='phase1Init();\nconst phase3RestoredScroll';
let html=fs.readFileSync(entry,'utf8');
assert.equal(html.split(boot).length,2,'QA injection anchor must uniquely match the current boot');
const hook=`globalThis.__c3Audit={
 fund(){
  if(phase1Controller.state.stage!=='camp'||state.run)throw Error('Test funding permitted in Camp only');
  state.fragments=10000;state.gold=10000;state.crafting??=WandererV013Crafting.create();state.crafting.essence=1000;
  render();return true;
 },
 snapshot(){
  const g=phase1Controller.state;
  return {view,stage:g.stage,realm:g.dungeon?.realm??null,stash:state.stash.length,
   crafted:state.stash.filter(item=>!!item.recipeId).map(item=>({recipeId:item.recipeId,rarity:item.rarity})),
   fragments:state.fragments,unlocked:g.unlocked,dungeonNodes:g.dungeon?.realm?phase1Controller.realmMap()?.nodes.length:0,points:WandererAutomaticTalents.earned(state.automaticTalents)-state.automaticTalents.nodes.length};
 }
};`;
html=html.replace(boot,'phase1Init();\n'+hook+'\nconst phase3RestoredScroll');
fs.writeFileSync(entry,html);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400).end();return;}
 const filepath=path.resolve(root,name==='/'?'index.html':name.slice(1));
 if(!filepath.startsWith(root+path.sep)&&filepath!==entry){res.writeHead(403).end();return;}
 fs.readFile(filepath,(err,bytes)=>{
  if(err){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(filepath)]||'application/octet-stream'});
  res.end(bytes);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 let browser;
 const report=path.resolve('reports/v013-c3-browser');
 fs.mkdirSync(report,{recursive:true});
 try{
  const launch={headless:true};if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
  browser=await chromium.launch(launch);
  for(const [width,height] of [[1280,800],[390,844]]){
   const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   page.setDefaultTimeout(10000);
   try{
    await page.goto(url,{waitUntil:'load'});
    assert.equal(await page.evaluate(()=>WandererAutomaticTalents.NODES.length),343);
    // Current v15 iframe (not the retired inline Talent Tree).
    await page.getByRole('button',{name:'Talents',exact:true}).click();
    const iframe=page.frameLocator('iframe[title="Talent tree"]');
    await iframe.locator('#nodes .node').first().waitFor();
    assert((await iframe.locator('#nodes .node').count())>=300);
    assert.equal(await page.locator('.talentGraphViewport').count(),0);
    await page.screenshot({path:path.join(report,'talents-'+width+'.png')});
    // Current Forge: one Uncommon Blueprint, never a guaranteed free drop.
    assert.equal(await page.evaluate(()=>__c3Audit.fund()),true);
    await page.locator('[data-phase3-nav="city-center"]').click();
    await page.locator('#v013Recipe').waitFor();
    assert(await page.locator('.v013Forge').isVisible());
    await page.locator('#v013Recipe').selectOption('green_sword');
    const before=await page.evaluate(()=>__c3Audit.snapshot());
    assert(await page.locator('#v013Craft').isEnabled());
    await page.screenshot({path:path.join(report,'forge-'+width+'.png')});
    await page.locator('#v013Craft').click();
    await page.getByText('Item Forged',{exact:true}).waitFor();
    const after=await page.evaluate(()=>__c3Audit.snapshot());
    assert.equal(after.stash,before.stash+1);
    assert(after.fragments<before.fragments);
    assert(after.crafted.some(item=>item.recipeId==='green_sword'&&item.rarity==='Uncommon'));
    await page.keyboard.press('Escape');
    // Inventory and equipment dialog share the actual equipment UI.
    await page.locator('[data-phase3-nav="equipment"]').click();
    await page.locator('.equipmentInventory').waitFor();
    const crafted=page.locator('[data-item]').first();
    assert((await page.locator('[data-item]').count())>=1);
    await page.screenshot({path:path.join(report,'inventory-'+width+'.png')});
    await crafted.click();
    const itemDialog=page.locator('dialog.itemDialog[open]');
    await itemDialog.waitFor();
    const rect=await itemDialog.boundingBox();
    assert(rect&&rect.width<=width+2,'Item popup wider than viewport');
    await page.keyboard.press('Escape');
    // Current deterministic Dungeon: three risk cards, a contract and a map.
    await page.locator('[data-phase3-nav="phase1"]').click();
    await page.locator('[data-phase1-expedition]:visible').first().click();
    assert.equal(await page.locator('[data-realm-card]').count(),3);
    await page.locator('[data-realm-card]').first().click();
    assert.equal(await page.locator('[data-stage7-contract]').count(),2);
    await page.locator('#stage7SkipContract').click();
    await page.locator('[data-realm-viewport]').waitFor();
    assert((await page.evaluate(()=>__c3Audit.snapshot())).dungeonNodes>=18,'Current Dungeon card must contain 18-22 nodes');
    assert((await page.locator('[data-dungeon-room]').count())>=2,'Fog initially exposes only reachable room nodes');
    assert.equal(await page.locator('[data-map-zoom-value]').innerText(),'100%');
    await page.locator('[data-map-zoom="in"]').click();
    assert.equal(await page.locator('[data-map-zoom-value]').innerText(),'120%');
    await page.locator('[data-dungeon-room="1"]').evaluate(node=>node.click());
    await page.locator('dialog.realmRouteDialog[open]').waitFor();
    assert(await page.getByRole('button',{name:'Enter room',exact:true}).isVisible());
    await page.keyboard.press('Escape');
    await page.screenshot({path:path.join(report,'dungeon-'+width+'.png')});
    assert.deepEqual(errors,[],width+'px browser JavaScript errors');
    console.log('C3_BROWSER='+JSON.stringify({viewport:width,treeNodes:343,crafted:'green_sword',contractCards:2,mapRooms:await page.locator('[data-dungeon-room]').count(),errors:errors.length}));
   }finally{await context.close();}
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
