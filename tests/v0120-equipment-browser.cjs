// Synthetic, RAM-only fixture. Native gear/vendor UI; no combat simulation or cloud access.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';
assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){
 phase1Init();phase1Controller.state.unlocked=5;state.gold=state.fragments=10000;
 const belt=makeItem(5,'belt',null,'forge','Cloth','Rare');state.stash.push(belt);
 state.equip.weapon={...state.equip.weapon,effect:'poison',magic:'poison'};
 globalThis.__gearTest={beltId:belt.id,snapshot:()=>JSON.parse(JSON.stringify(state)),rollBelt:()=>{state.merchant.stock=[{...makeItem(5,'belt',null,'merchant','Plate','Rare'),goldPrice:10}];renderMerchant();}};
 render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[ext]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.setDefaultTimeout(5000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{if(route.request().url().startsWith(base))return route.continue();external.push(route.request().url());return route.abort();});
  await page.goto(base+'/?expeditionPhase1=1');
  await page.locator('.phase3Camp [data-phase3-nav="equipment"]').click();
  assert.equal(await page.locator('.paper [data-eqslot]').count(),10);
  assert.equal(await page.locator('#affinityFilter,.equipmentBonuses,.affinityBadge').count(),0);
  const boxes=await page.locator('.paper [data-eqslot]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y),'equipment slots must not overlap');}
  await page.selectOption('#slotFilter','belt');const id=await page.evaluate(()=>__gearTest.beltId);
  await page.locator('[data-item="'+id+'"]').click();assert.match(await page.locator('#itemInspect').innerText(),/E5.*Rare/);assert.match(await page.locator('#itemInspect').innerText(),/Cloth/);
  await page.locator('#equipThis').click();assert.equal(await page.evaluate(()=>__gearTest.snapshot().equip.belt.id),id);
  await page.selectOption('#slotFilter','all');await page.locator('[data-eqslot="belt"]').click();await page.locator('#unequipThis').click();
  assert.equal(await page.evaluate(()=>__gearTest.snapshot().equip.belt),null);
  await page.locator('#phase3Return').click();await page.locator('.phase3Camp [data-phase3-nav="forge"]').click();
  assert.equal(await page.getByRole('heading',{name:'Affinity Transfer',exact:true}).count(),0);
  await page.selectOption('#forgeSlot','belt');await page.selectOption('#forgeSubtype','Leather');await page.selectOption('#forgeTier','5');
  await page.locator('#craft').click();assert.deepEqual(errors,[]);await page.locator('dialog [data-close]').click();
  assert(await page.evaluate(()=>__gearTest.snapshot().stash.some(i=>i.slot==='belt'&&i.armorType==='Leather'&&i.tier===5)));
  await page.locator('#phase3Return').click();await page.locator('.phase3Camp [data-phase3-nav="merchant"]').click();await page.evaluate(()=>__gearTest.rollBelt());
  assert.equal(await page.getByRole('heading',{name:/Sigils/}).count(),0);await page.locator('[data-buy]').click();
  const confirm=page.locator('dialog [data-confirm]');if(await confirm.count())await confirm.click();
  assert(await page.evaluate(()=>__gearTest.snapshot().stash.some(i=>i.slot==='belt'&&i.armorType==='Plate'&&i.source==='merchant')));
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS v0.12.0 gear '+width+'px: ten slots, no gear affinities/sets, Belt equip/unequip/craft/buy, E# labels, isolated from cloud');
  await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
