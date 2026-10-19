// Isolated real-browser v0.12 smoke. No Firebase, no online account, no real saves.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<script id="onlineAccountLoader">[\s\S]*?<\/script>/,'');
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(req.url.split('?')[0]);
 if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 const ext=path.extname(file);const type=ext==='.mjs'||ext==='.js'?'application/javascript':ext==='.css'?'text/css':ext==='.webp'?'image/webp':'application/octet-stream';
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':type});res.end(err?'Not found':data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:850}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('#v012-launch').waitFor({timeout:10000});
   await page.evaluate(()=>localStorage.setItem('wanderer-test-untouched','preserved'));
   await page.locator('#v012-launch').click();
   await page.locator('#v012-overlay .v12-family').first().waitFor();
   assert.equal(await page.locator('#v012-overlay .v12-family').count(),5);
   assert.equal(await page.locator('#v012-overlay select[data-difficulty] option').first().innerText(),'Expedition 1','old Dungeon name should be replaced');
   assert((await page.locator('#v012-overlay').innerText()).includes('Health and Mana reset to full after every Expedition'));
   assert.equal(await page.locator('#v012-overlay button[data-action="pots"]').count(),4,'Potion loadout may still be chosen at camp');
   assert(!(await page.locator('#v012-overlay select[data-difficulty]').innerText()).includes('Dungeon'));

   assert.equal(await page.locator('#v012-overlay button[data-action="camp-heal"]').count(),0,'Health potions cannot be consumed in the main Camp');
   assert.equal(await page.locator('#v012-overlay button[data-action="camp-mana"]').count(),0,'Mana potions cannot be consumed in the main Camp');
   assert.equal(await page.locator('#v012-overlay button[data-action="potion"]').count(),0,'Potion use is available only between Planes');
   assert.equal(await page.locator('#v012-overlay .v12-rest .v12-bar-label').count(),2,'The hub Camp shows both full Health and Mana');
   await page.locator('#v012-overlay button[data-action="begin"][data-id="blood"]').click();
   assert.equal(await page.locator('#v012-overlay .v12-passive').count(),3);
   await page.locator('#v012-overlay .v12-passive').first().click();
   assert.equal(await page.locator('#v012-overlay .v12-path').count(),3);
   assert.equal(await page.locator('#v012-overlay button[data-action="potion"]').count(),2,'Potions remain available between Planes');
   assert.equal(await page.locator('#v012-overlay .v12-plane-badges').count(),3,'Three offered Planes show their Waves and Elite status');
   assert.equal(await page.locator('#v012-overlay .v12-inventory summary').count(),1,'Inventory is accessible between Planes');
   await page.locator('#v012-overlay .v12-inventory summary').click();
   assert((await page.locator('#v012-overlay .v12-inventory select[data-slot]').count())>=1,'Equipment selector must work during Plane preparation');
   assert((await page.locator('#v012-overlay .v12-plane-badges').first().innerText()).includes('Wave'),'Wave count must be visible');
   assert.equal(await page.locator('#v012-overlay .v12-passive-entry').count(),1,'Current passives should be visible');
   const familyLabels=await page.locator('#v012-overlay .v12-path .v12-tag').allTextContents();
   assert(familyLabels.some(x=>x.includes('Blood')),'initial affinity should be guaranteed');
   assert.equal(await page.locator('#v012-overlay button[data-action="reroll"]:disabled').count(),1);
   await page.locator('#v012-overlay button[data-action="reroll"]:not(:disabled)').first().click();
   assert((await page.locator('#v012-overlay .v12-progress').innerText()).includes('2 rerolls'));
   await page.locator('#v012-overlay button[data-action="path"]').first().click();
   assert.equal(await page.locator('#v012-overlay .v12-path').count(),0);
   const enemyCount=await page.locator('#v012-overlay .v12-enemy').count();
   assert.equal(enemyCount,1,'first room is a combat with one active enemy');
   assert.equal(await page.locator('#v012-overlay button[data-kind="hp"]').count(),0,'Health potions must never be usable in combat');
   assert.equal(await page.locator('#v012-overlay button[data-kind="mana"]').count(),0,'Mana potions cannot be used in combat');
   if(enemyCount===1){
    assert.equal(await page.locator('#v012-overlay button[data-action="target"]').count(),0,'no manual targeting');
    await page.locator('#v012-overlay button[data-action="pause"]').click();
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer-test-untouched')),'preserved');
   assert(await page.evaluate(()=>!!localStorage.getItem('wanderer_v012_prototype_local_v1')));
   assert.equal(await page.locator('#v012-overlay').evaluate(x=>getComputedStyle(x).position),'fixed');
   assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+5,'horizontal overflow at '+width);
   await page.locator('#v012-overlay button[data-action="close"]').click();
   assert.equal(await page.locator('#v012-overlay').count(),0);
   await page.locator('#v012-launch').click();
   assert.equal(await page.locator('#v012-overlay .v12-family').count(),0,'expedition should persist across reopen');
   await page.goto(base+'/?playtest=v012',{waitUntil:'domcontentloaded'});
   await page.locator('#v012-overlay').waitFor();
   // Use a separate browser context for a fresh Magic account. Clearing storage
   // mid-combat in the same page gets legitimately undone by pagehide autosave.
   const fresh=await browser.newContext({viewport:{width,height:850}});
   const magicPage=await fresh.newPage();
   magicPage.on('pageerror',err=>errors.push(err.message));
   await magicPage.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await magicPage.goto(base+'/?playtest=v012',{waitUntil:'domcontentloaded'});
   await magicPage.locator('#v012-overlay button[data-action="begin"][data-id="magic"]').waitFor();
   await magicPage.locator('#v012-overlay button[data-action="begin"][data-id="magic"]').click();
   assert.equal(await magicPage.locator('#v012-overlay button[data-action="element"]').count(),3);
   assert.equal(await magicPage.locator('#v012-overlay .v12-passive').count(),3);
   assert((await magicPage.locator('#v012-overlay').innerText()).includes('Spell Power'),'the Magic school choice should explain Spell Power');
   await magicPage.locator('#v012-overlay button[data-action="element"][data-id="frost"]').click();
   assert.equal(await magicPage.locator('#v012-overlay button[data-action="element"]').count(),0);
   assert.equal(await magicPage.locator('#v012-overlay button[data-action="passive"]').count(),3);
   assert((await magicPage.locator('#v012-overlay').innerText()).includes('Magic · Frost'));
   await magicPage.locator('#v012-overlay button[data-action="passive"]').first().click();
   assert.equal(await magicPage.locator('#v012-overlay .v12-path').count(),3);
   await fresh.close();
   assert.deepEqual(errors,[],'browser uncaught errors at '+width);
   await context.close();
  }
  console.log('PASS v0.12 desktop/mobile browser: visible Planes/Waves/Elites, camp-only HP/MP, inventory and passive UI');
 } finally {await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;server.close();});
