// Native Forge/Merchant/Rune UI and account isolation, on development-only RAM fixtures.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){
 phase1Init();phase1Controller.state.unlocked=20;state.gold=10000;state.fragments=10000;
 const legendary=makeItem(20,'helm',null,'loot','Helm','Legendary');state.stash.push(legendary);
 globalThis.__phase4={snapshot:()=>({gold:state.gold,fragments:state.fragments,stash:state.stash,
  sigils:state.sigils,stock:state.merchant?.stock,sigilStock:state.merchant?.sigils,
  maxDungeon:state.maxDungeon,runes:state.runes,picks:phase1Build?.picks||[],rerolls:phase1Controller.state.rerollsLeft}),
  legendaryId:legendary.id,rng:n=>{Math.random=()=>n;},
  runeDialog:()=>{offerBossRunes(20);showPendingRuneReward();},
  start:()=>phase1Begin(1)};render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const mime={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(source.replace(boot,fixture+'const phase3RestoredScroll=null;'));return;}
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 fs.readFile(file,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':body);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
  await page.addInitScript(()=>{localStorage.setItem('wanderer_browser_proto_v01','KEEP_CLASSIC');localStorage.setItem('wanderer_account_audit','KEEP_ACCOUNT');});
  await page.goto(base+'/?expeditionPhase1=1',{waitUntil:'domcontentloaded'});
  const snap=()=>page.evaluate(()=>__phase4.snapshot());
  await page.locator('[data-phase3-nav="forge"]').last().click();
  await page.locator('#forgeTier').selectOption('20');await page.locator('#forgeSlot').selectOption('armor');
  await page.locator('#forgeQualityToggle').selectOption('2');
  const beforeCraft=await snap();await page.locator('#craft').click();await page.locator('dialog [data-close]').click();
  const crafted=(await snap()).stash.find(i=>i.source==='forge');assert.equal(crafted.tier,20);assert.equal(crafted.craftPrice,630);
  assert.equal((await snap()).fragments,beforeCraft.fragments-630);assert.notEqual(crafted.rarity,'Legendary');
  // Original Legendary reinforcement panel, no skill/affinity replacement.
  await page.locator('#upgradeLegendaryBtn').click();await page.locator('dialog [data-confirm]').click();
  const upgraded=(await snap()).stash.find(i=>i.id===beforeCraft.stash.find(i=>i.rarity==='Legendary').id);
  assert.equal(upgraded.upgradeRank,1);assert.equal(upgraded.legendaryId,beforeCraft.stash.find(i=>i.rarity==='Legendary').legendaryId);
  await page.locator('#phase3Return').click();await page.locator('[data-phase3-nav="merchant"]').last().click();
  assert.equal(await page.locator('.merchantSigilsPanel').count(),0,'removed gear Sigils do not return in v0.12');
  let before=await snap();await page.locator('#refreshShop').click();let after=await snap();
  assert.deepEqual(after.sigilStock,[]);assert.equal(after.gold,before.gold-96);assert(after.stock.every(i=>i.tier===20));
  before=after;await page.locator('[data-buy]').first().click();await page.locator('dialog [data-confirm]').click();after=await snap();
  assert.equal(after.gold,before.gold-before.stock[0].goldPrice);assert(after.stash.some(i=>i.id===before.stock[0].id));
  assert.equal(after.sigils.length,0);assert.equal(crafted.effect,null,'no gear affinity generated');
  await page.locator('#phase3Return').click();await page.evaluate(()=>__phase4.runeDialog());
  await page.locator('[data-rune-choice]').first().click();assert.equal((await snap()).runes.length,1);assert.equal((await snap()).maxDungeon,1);
  assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+8);
  assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'KEEP_CLASSIC');
  assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_account_audit')),'KEEP_ACCOUNT');
  assert(!requests.some(u=>/online\/(app|firebase-client)\.mjs/.test(u)));assert.deepEqual(errors,[]);
  await page.close();console.log('PASS Phase 4 native economy UI '+width+'px: tiered craft/buy, Masterwork, Legendary, equipment reroll, removed gear Sigils, Runes, save isolation');
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
