// Browser interactions on an isolated in-memory fixture. All external requests are blocked.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),boot='load();if(!state.merchant)rollShop();save();render();';
const fixture=String.raw`
load();if(!state.merchant)rollShop();save();
globalThis.fixture={seed(){
 fresh();state.equip=makeSlots();state.stash=[];state.runes=[];state.maxDungeon=20;state.chosen=20;
 state.equip.weapon=makeItem(20,'weapon','poison','loot','Bow','Rare');
 for(const slot of ['offhand','armor']){const o=makeItem(20,slot,'shield','loot',slot==='offhand'?'Shield':'random','Rare');o.isNew=true;state.stash.push(o);}
 const r=makeRune('might',10);r.isNew=true;state.runes=[r];save();this.equipment();
},equipment(){view='equipment';render();},dungeons(){view='dungeons';render();}};
fixture.equipment();document.getElementById('screen').inert=false;document.getElementById('nav').inert=false;
`;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(boot,fixture).replace(/<script type="module"[^>]*><\/script>/g,'');
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(e,data)=>{res.writeHead(e?404:200);res.end(e?'':data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 try{for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
 await page.goto(origin);await page.evaluate(()=>fixture.seed());
 assert.equal(await page.locator('.newBadge').count(),3);
 await page.locator('[data-item]').filter({has:page.locator('img[alt="Shield"]')}).click();
 assert(await page.locator('#equipThis').isDisabled());assert.equal(await page.locator('.newBadge').count(),2);
 await page.reload();await page.evaluate(()=>fixture.equipment());assert.equal(await page.locator('.newBadge').count(),2);
 await page.locator('[data-rune-equip]').click();assert.equal(await page.locator('.newBadge').count(),1);
 await page.locator('#markAllSeen').click();assert.equal(await page.locator('.newBadge').count(),0);
 await page.reload();await page.evaluate(()=>fixture.equipment());assert.equal(await page.locator('.newBadge').count(),0);
 assert((await page.locator('.equipmentBonuses').innerText()).includes('32%'));
 assert((await page.locator('.equipmentBonuses').innerText()).includes('5 pieces alone do not increase it'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'equipment fits viewport');
 await page.evaluate(()=>fixture.dungeons());const cards=await page.locator('[data-path]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-path')));
 assert((await page.locator('#rerollPath').innerText()).includes('10'));
 await page.reload();await page.evaluate(()=>fixture.dungeons());assert.deepEqual(await page.locator('[data-path]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-path'))),cards);
 assert.deepEqual(errors,[]);await context.close();
 }console.log('PASS v0.9.3 desktop/mobile clicks, NEW/reload, disabled Off-Hand, rates and persistent offers');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
