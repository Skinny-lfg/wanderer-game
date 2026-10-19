// Isolated functional UI fixture; forced Wave completion, no combat simulation or real-save IO.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='if(PHASE1_PREVIEW){phase1Init();render();}else{load();if(!state.merchant)rollShop();save();render();}';assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){phase1Init();
 globalThis.__realmTest={snapshot:()=>({game:JSON.parse(JSON.stringify(phase1Controller.state)),picks:phase1Build?.picks||[],element:phase1Build?.element||null,draft:phase1Draft?.kind||null,active:!!state.run,status:state.run?.status||null}),
 win:()=>{if(state.run?.status!=='fight')throw Error('No active Wave');state.run.enemy.hp=0;phase1WaveWon();},passive:phase2ChoosePassive};render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{localStorage.setItem('wanderer_browser_proto_v01','UNTOUCHED');window.setInterval=()=>0;const native=window.setTimeout;window.setTimeout=(f,ms,...args)=>native(f,ms===650?5:ms,...args);});
  await page.route('**/*',route=>{if(route.request().url().startsWith(base))return route.continue();external.push(route.request().url());return route.abort();});
  const snap=()=>page.evaluate(()=>__realmTest.snapshot());
  await page.goto(base+'/?expeditionPhase1=1');await page.locator('[data-phase1-expedition="1"]').click();
  assert.equal(await page.locator('[data-phase2-initial]').count(),6);
  await page.locator('[data-phase2-initial="magic"]').click();assert.equal((await snap()).picks.length,0);
  for(const id of ['fire','frost','lightning'])assert.equal(await page.locator('[data-phase2-element="'+id+'"]').count(),1);
  await page.locator('[data-phase2-element="frost"]').click();let s=await snap();assert.deepEqual(s.picks,['deep_winter']);assert.equal(s.element,'frost');
  const magicIndex=s.game.offers.findIndex(o=>o.family==='magic'),otherIndex=(magicIndex+1)%3;
  await page.locator('[data-phase1-plane="'+s.game.offers[otherIndex].id+'"]').click();const selected=(await snap()).game.selected.id;
  const unchanged=JSON.stringify((await snap()).game.offers[otherIndex]);
  for(let n=0;n<3;n++)await page.locator('[data-phase2-reroll="'+magicIndex+'"]').click();
  s=await snap();assert.equal(s.game.selected.id,selected);assert.equal(JSON.stringify(s.game.offers[otherIndex]),unchanged);assert.equal(s.game.offers[magicIndex].family,'magic');
  assert.equal(await page.locator('[data-phase2-reroll="'+magicIndex+'"]').isDisabled(),true);
  await page.locator('[data-phase1-plane="'+s.game.offers[magicIndex].id+'"]').click();assert.equal((await snap()).active,false);assert.equal((await snap()).picks.length,1);
  await page.locator('#phase2EnterRealm').click();s=await snap();assert.equal(s.active,true);assert.equal(s.picks.length,1);
  const waves=s.game.selected.waves;
  for(let wave=0;wave<waves;wave++){await page.waitForFunction(()=>__realmTest.snapshot().status==='fight');await page.evaluate(()=>__realmTest.win());}
  await page.waitForSelector('[data-phase2-passive]');s=await snap();assert.equal(s.active,false);assert.equal(s.picks.length,1);assert.equal(s.draft,'reward');
  const reward=page.locator('[data-phase2-passive]').first(),id=await reward.getAttribute('data-phase2-passive');
  assert.equal(await reward.locator('.itemAffinityGlyph').count(),1);await reward.click();s=await snap();assert.equal(s.picks.length,2);assert.equal(s.game.planeIndex,2);
  assert(s.game.offers.every(o=>o.family!=='magic'),'initial affinity needs a second distinct acquisition after first Realm');
  assert.deepEqual(s.game.rerollsByRealm[1],[3,3,3]);assert.equal(s.game.rerollsByRealm[0][magicIndex],0);
  assert.equal(await page.evaluate(id=>__realmTest.passive(id),id),false);assert.equal((await snap()).picks.length,2);
  assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'UNTOUCHED');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert(await page.locator('body').evaluate(n=>n.scrollWidth<=innerWidth+1));
  console.log('PASS v0.12.0 Realms '+width+'px: six affinities, Magic element, one starter, independent rerolls, explicit entry, one post-Realm passive');
  await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
