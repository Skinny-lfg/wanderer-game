// Isolated functional UI fixture; forced Wave completion, no combat simulation or real-save IO.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();render();';assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){phase1Init();globalThis.__runes={
 setup:()=>{const home=makeRune('might',10),spare=makeRune('might',10),best=makeRune('might',20);state.runes.push(home,spare,best);state.runeSlots[0]=home.id;phase5Persist();},
 snap:()=>({slots:state.runeSlots,runes:state.runes,fragments:state.fragments,seed:phase4Seed,home:phase4Home,locked:phase4Resume}),
 attempts:()=>[unequipRune(0),salvageRune(state.runes[1].id),salvageDuplicateRunes(),equipRune(state.runes[2].id,1)],
 stored:()=>localStorage.getItem(WandererGame.validationStatus().key)};render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>{window.setInterval=()=>0;});await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 await page.goto(base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=rune_guard');const ready=()=>page.waitForFunction(()=>WandererGame.validationStatus().ready);await ready();await page.evaluate(()=>__runes.setup());await page.locator('[data-phase1-expedition="1"]').click();await page.locator('[data-phase2-initial="blood"]').click();await page.reload();await ready();assert.equal(await page.locator('#phase4Resume').count(),1);
 await page.locator('[data-phase3-nav="runes"]').click();const before=await page.evaluate(()=>__runes.snap()),raw=await page.evaluate(()=>__runes.stored());assert.equal(before.locked,true);
 assert(await page.locator('[data-rune-remove="0"]').isDisabled());assert(await page.locator('#recycleDuplicateRunes').isDisabled());for(const button of await page.locator('[data-rune-sell]').all())assert(await button.isDisabled());
 assert.deepEqual(await page.evaluate(()=>__runes.attempts()),[false,false,false,false]);assert.deepEqual(await page.evaluate(()=>__runes.snap()),before);assert.equal(await page.evaluate(()=>__runes.stored()),raw);
 await page.locator('[data-phase3-nav="phase1"]').click();await page.locator('#phase4Resume').click();assert.deepEqual(await page.evaluate(()=>__runes.attempts()),[false,false,false,false]);assert.deepEqual(errors,[]);await context.close();console.log('PASS resumed Rune guards '+width+'px: unequip/salvage/recycling/equip blocked; profile, resources and storage unchanged');
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
