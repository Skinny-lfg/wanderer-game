// One native incoming attack per viewport; synthetic RAM-only profile, no gameplay simulation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){phase1Init();
 state.equip.helm=makeItem(5,'helm',null,'loot','Leather','Rare');delete state.equip.helm.evasionRating;
 const belt=makeItem(5,'belt',null,'loot','Leather','Rare');state.stash.push(belt);
 globalThis.__evasion={beltId:belt.id,hit:()=>{
  phase1Begin(1);phase2ChooseInitial('blood');phase1Choose(phase1Controller.state.offers.find(o=>o.family==='blood').id);phase1Enter();
  const r=state.run;r.hp=r.maxhp/2;r.barrier=10;r.stats.attacksPerSec=0;r.stats.blockChance=0;
  Object.assign(r.enemy,{hp:500,maxhp:1000,atk:100,attackType:'physical',eliteType:'tank',bossStyle:null});
  r.tPlayer=r.tDot=0;r.tEnemy=100;const before={hp:r.hp,barrier:r.barrier};phase4Seed=12345;updateFight();
  return {before,after:{hp:r.hp,barrier:r.barrier},debuff:r.playerHealingDebuffUntil};
 }};render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture+'const phase3RestoredScroll=null;'));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[],external=[];
  page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));await context.addInitScript(()=>{window.setInterval=()=>0;localStorage.setItem('wanderer_browser_proto_v01','UNTOUCHED');});
  await page.route('**/*',route=>{if(route.request().url().startsWith(base))return route.continue();external.push(route.request().url());return route.abort();});
  await page.goto(base+'/?expeditionPhase1=1');await page.locator('[data-phase3-nav="equipment"]').click();
  await page.locator('.inventoryAdvancedStats summary').click();
  assert.match(await page.locator('.equipmentStats').innerText(),/Evasion[\s\S]*rating.*% vs E1/);
  await page.selectOption('#slotFilter','belt');const id=await page.evaluate(()=>__evasion.beltId);await page.locator('[data-item="'+id+'"]').click();
  assert.match(await page.locator('.itemComparison').innerText(),/Evasion Rating/);
  const result=await page.evaluate(()=>__evasion.hit());assert.deepEqual(result.after,result.before);assert.equal(result.debuff,0);
  assert.equal(await page.locator('#scene .float').filter({hasText:'DODGE'}).count(),1);
  assert.match(await page.locator('#expeditionLog').textContent(),/DODGE.*physical attack avoided/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'UNTOUCHED');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log('PASS Evasion '+width+'px: stats, comparison, native DODGE text/log, zero hit effects, old save untouched');await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
