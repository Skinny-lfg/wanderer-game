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
},equipment(){view='equipment';render();},dungeons(){view='dungeons';render();},vfx(){document.getElementById('screen').innerHTML='<div class="scene" id="scene"><img id="heroPortrait" src="assets/characters/avatars/wanderer.png" alt=""><img id="enemyPortrait" src="assets/elites/tank.png" alt=""></div>';animateStrike('Bow');floatText(24);animateEnemyStrike();}};
fixture.equipment();document.getElementById('screen').inert=false;document.getElementById('nav').inert=false;
`;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(boot,fixture).replace(/<script type="module"[^>]*><\/script>/g,'');
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(e,data)=>{res.writeHead(e?404:200);res.end(e?'':data);});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
 await page.goto(origin);
 const missing=await page.evaluate(async()=>{
  const assets=['assets/branding/wanderer-logo.webp',...['tank','caster','vampire','berserker'].map(id=>'assets/elites/'+id+'.png')];
  return (await Promise.all(assets.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(null);img.onerror=()=>resolve(src);img.src=src;})))).filter(Boolean);
 });
 assert.deepEqual(missing,[],'the logo and all elite artworks load on desktop/mobile');
 await page.evaluate(()=>fixture.seed());
 assert.equal(await page.locator('.newBadge').count(),3);
 await page.locator('[data-item]').filter({has:page.locator('img[alt="Shield"]')}).click();
 assert(await page.locator('#equipThis').isDisabled());assert.equal(await page.locator('.newBadge').count(),2);
 await page.reload();await page.evaluate(()=>fixture.equipment());assert.equal(await page.locator('.newBadge').count(),2);
 await page.locator('[data-rune-equip]').click();assert.equal(await page.locator('.newBadge').count(),1);
 await page.locator('#markAllSeen').click();assert.equal(await page.locator('.newBadge').count(),0);
 await page.reload();await page.evaluate(()=>fixture.equipment());assert.equal(await page.locator('.newBadge').count(),0);
 assert((await page.locator('.equipmentBonuses').innerText()).includes('14%'),'shared armor affinity proc is presented');
 assert((await page.locator('.equipmentBonuses').innerText()).includes('More pieces widen the affinity pool'),'no per-piece proc inflation');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'equipment fits viewport');
 const chrome=await page.evaluate(()=>{
   const root=getComputedStyle(document.documentElement);
   const account=document.querySelector('[data-online-action="account"]');
   const leaderboard=document.querySelector('[data-online-action="leaderboard"]');
   const feedback=document.querySelector('[data-online-action="feedback"]');
   return {bg:root.getPropertyValue('--bg').trim(),panel:getComputedStyle(document.querySelector('.panel')).backgroundImage,
    accountIcon:getComputedStyle(account,'::before').width,accountHeight:account.getBoundingClientRect().height,
    leaderboardBorder:getComputedStyle(leaderboard).borderColor,feedbackIcon:getComputedStyle(feedback,'::before').width,
    buttonsWidth:document.querySelector('.onlineBar').getBoundingClientRect().width};
 });
 assert.equal(chrome.bg,'#1b0b13','whole-page canvas should use dark red');
 assert.ok(chrome.panel.includes('linear-gradient'),'panels retain dark-red layered depth');
 assert.ok(parseFloat(chrome.accountIcon)>=14,'account control has a meaningful icon');
 assert.ok(chrome.accountHeight>=38,'account action remains tappable');
 assert.ok(parseFloat(chrome.feedbackIcon)>=14,'feedback control matches account and leaderboard');

 const neutrals=await page.evaluate(()=>{
  const board=document.createElement('div');
  board.style.cssText='position:absolute;left:-2000px;top:-2000px;width:800px;pointer-events:none';
  board.innerHTML='<div class="nextWaveOdds"></div><div class="nextGearOdds"></div><div class="nextRarityItem"></div>'+
   '<div class="combatRuneReadout"></div><div class="setTrack"></div><div class="runeSlot"></div>'+
   '<div class="valuable"></div><div class="stashGrid"></div><div class="log"></div>'+
   '<div class="protectionPanel"></div><div class="stat"></div>'+
   '<div class="dungeonCard"><div class="favoredGearItem"><span class="favoredGearIcon"></span></div></div>'+
   '<div class="equipmentLoadout"><div class="paper"></div></div>';
  document.body.appendChild(board);
  const selectors=['.nextWaveOdds','.nextGearOdds','.nextRarityItem','.combatRuneReadout',
   '.setTrack','.runeSlot','.valuable','.stashGrid','.log','.protectionPanel','.stat',
   '.dungeonCard .favoredGearItem','.dungeonCard .favoredGearIcon','.equipmentLoadout .paper'];
  const colors=selectors.map(selector=>({selector,color:getComputedStyle(board.querySelector(selector)).backgroundColor}));
  board.remove();
  return {canvas:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundImage,colors};
 });
  assert.equal(neutrals.canvas,'rgb(27, 11, 19)','the base canvas is dark red, including outside cards');
 assert(neutrals.body.includes('radial-gradient'),'whole-page backdrop should have burgundy gradients');
 for(const {selector,color} of neutrals.colors){
   const rgb=color.slice(color.indexOf('(')+1,color.indexOf(')')).split(',').map(part=>Number(part.trim()));
   assert(rgb.length>=3&&rgb.slice(0,3).every(Number.isFinite),'expected solid surface color for '+selector+': '+color);
   assert(rgb[0]>rgb[2],'neutral UI surface should lean red, not blue: '+selector+' = '+color);
 }
 await page.evaluate(()=>fixture.dungeons());
 assert.equal(await page.locator('.legendaryHunt').count(),0,'Legendary Hunt hidden pending its next phase');
 const cards=await page.locator('[data-path]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-path')));
 assert((await page.locator('#rerollPath').innerText()).includes('10'));
 await page.reload();await page.evaluate(()=>fixture.dungeons());assert.deepEqual(await page.locator('[data-path]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-path'))),cards);
 const visuals=await page.evaluate(()=>{
  fixture.vfx();
  const display=selector=>getComputedStyle(document.querySelector(selector)).display;
  const motion=selector=>getComputedStyle(document.querySelector(selector)).animationName;
  return {effect:display('.combatVfx'),numbers:display('.float'),projectile:motion('.combatVfx'),
   damageRise:motion('.float'),heroStrike:motion('#heroPortrait'),enemyStrike:motion('#enemyPortrait')};
 });
 assert.notEqual(visuals.effect,'none','weapon impact/projectile VFX must render');
 assert.notEqual(visuals.numbers,'none','floating damage numbers must render');
 assert.equal(visuals.projectile,'vfxTravel','Bow should animate projectile');
 assert.equal(visuals.damageRise,'rise','damage numbers should animate upward');
 assert.equal(visuals.heroStrike,'fxBow','player Bow attack animation restored');
 assert.equal(visuals.enemyStrike,'fxEnemyAttack','enemy attack animation restored');
 assert.deepEqual(errors,[]);await context.close();
 }console.log('PASS v0.9.3 desktop/mobile clicks, NEW/reload, disabled Off-Hand, rates and persistent offers');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
