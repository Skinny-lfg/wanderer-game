// Isolated real-browser v0.12 smoke. No Firebase, no online account, no real saves.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<script type="module" src="online\/app\.mjs[^"]*"><\/script>/,'');
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
   assert.equal(await page.locator('#v012-overlay button[data-action="camp-heal"]').count(),1,'Health potions must appear at camp');
   assert.equal(await page.locator('#v012-overlay button[data-action="camp-heal"]').isDisabled(),true,'full HP cannot waste a potion');
   await page.locator('#v012-overlay button[data-action="begin"][data-id="blood"]').click();
   assert.equal(await page.locator('#v012-overlay .v12-passive').count(),3);
   await page.locator('#v012-overlay .v12-passive').first().click();
   assert.equal(await page.locator('#v012-overlay .v12-path').count(),3);
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
   assert.equal(await page.locator('#v012-overlay button[data-kind="mana"]').count(),2,'Mana potions remain accessible');
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
   assert.deepEqual(errors,[],'browser uncaught errors at '+width);
   await context.close();
  }
  console.log('PASS v0.12 desktop/mobile browser: 3 affinity cap, camp-only Health, reroll, isolated save, reopen');
 } finally {await browser.close();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;server.close();});
