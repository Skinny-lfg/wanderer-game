// Wanderer v0.10.0 desktop/mobile browser layout and boss art regression.
// Isolated local fixture. No Firebase, user accounts, or real saves are touched.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const boot='load();if(!state.merchant)rollShop();save();render();';
const fixture=String.raw`
load();if(!state.merchant)rollShop();save();
globalThis.v0100={
 setup(kind){
  fresh();
  state.maxDungeon=10;state.chosen=10;
  state.equip.weapon=makeItem(10,'weapon',kind==='Staff'?'slow':'crit','loot',kind,'Rare');
  selectedPath=state.selectedPath='frost';
  startDungeon();
  document.getElementById('screen').inert=false;document.getElementById('nav').inert=false;
 },
 boss(){
  this.setup('Staff');
  state.run.enc=4;state.run.status='ready';renderCombat();
 },

 equipment(){
  fresh();state.maxDungeon=30;
  state.stash=Array.from({length:80},(_,i)=>makeItem(10+i%11,'weapon',null,'loot','Sword','Common'));
  view='equipment';renderStash();
  document.getElementById('screen').inert=false;document.getElementById('nav').inert=false;
 },
 dungeonSelector(){
  fresh();state.maxDungeon=20;state.chosen=10;view='dungeons';renderDungeons();
 },
  setMana(value){state.run.mp=value;updateBars();}
};
view='tavern';render();
document.getElementById('screen').inert=false;document.getElementById('nav').inert=false;
`;
let pageHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(pageHtml.split(boot).length-1,1,'expected one production boot anchor');
pageHtml=pageHtml.replace(boot,fixture).replace(/<script type="module"[^>]*><\/script>/g,'');
const server=http.createServer((req,res)=>{
 const p=decodeURIComponent(req.url.split('?')[0]);
 if(p==='/'){res.setHeader('Content-Type','text/html');return res.end(pageHtml);}
 const filename=path.resolve(root,'.'+p);
 if(!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(filename,(err,data)=>{res.writeHead(err?404:200);res.end(err?'':data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
   await page.goto(url);
   const desktop=width>650;
   const variant=desktop?'desktop':'mobile';
   const tavernImage=await page.locator('.tavernArt').evaluate(node=>getComputedStyle(node).backgroundImage);
   assert(tavernImage.includes('assets/backgrounds/tavern-'+variant+'.webp'),'Tavern uses correct '+variant+' background: '+tavernImage);

   const header=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
    return {nav:rect('#nav'),wallet:rect('#wallet'),width:document.documentElement.scrollWidth};
   });
   assert(header.width<=width+2,'header has horizontal overflow at '+width);
   if(desktop){
    assert.equal(await page.locator('#menuToggle').isVisible(),false,'desktop hamburger hidden');
    assert.equal(await page.locator('#onlineActions').isVisible(),true,'desktop utility actions visible');
    assert(Math.abs(header.wallet.top-header.nav.top)<=12,'desktop wallet aligned to Dungeons/navigation');
   }else{
    assert.equal(await page.locator('#menuToggle').isVisible(),true,'mobile hamburger visible');
    assert.equal(await page.locator('#onlineActions').isVisible(),false,'mobile utility actions initially folded');
    assert(header.wallet.bottom<=header.nav.top+3,'mobile currency above navigation');
    await page.locator('#menuToggle').click();
    assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'true','mobile aria-expanded');
    assert.equal(await page.locator('[data-online-action="leaderboard"]').isVisible(),true,'leaderboard in menu');
    await page.locator('[data-online-action="leaderboard"]').click();
    assert.equal(await page.locator('#onlineActions').isVisible(),false,'menu closes after selection');
   }
   await page.evaluate(()=>v0100.setup('Staff'));
   const dungeonImage=await page.locator('#scene').evaluate(node=>getComputedStyle(node).backgroundImage);
   assert(dungeonImage.includes('assets/backgrounds/dungeon-'+variant+'.webp'),'Combat uses correct '+variant+' background: '+dungeonImage);
   const backgroundLoaded=await page.evaluate(async variant=>{
    const paths=['tavern','dungeon'].map(name=>'assets/backgrounds/'+name+'-'+variant+'.webp');
    return Promise.all(paths.map(src=>new Promise(resolve=>{
     const img=new Image();img.onload=()=>resolve({src,w:img.naturalWidth,h:img.naturalHeight});img.onerror=()=>resolve({src,w:0,h:0});img.src=src;
    })));
   },variant);
   const widthExpected=desktop?1600:960,heightExpected=desktop?900:540;
   assert(backgroundLoaded.every(img=>img.w===widthExpected&&img.h===heightExpected),'website backgrounds load at expected dimensions: '+JSON.stringify(backgroundLoaded));

   assert.equal(await page.locator('#heroMpBar').count(),1,'caster displays mana bar below HP');
   const bar=await page.evaluate(()=>{const hp=document.querySelector('#heroHpFill'),mp=document.querySelector('#heroMpBar');return {hpBottom:hp.getBoundingClientRect().bottom,manaTop:mp.getBoundingClientRect().top}});
   assert(bar.manaTop>=bar.hpBottom-4,'caster mana bar must appear below HP');
   await page.evaluate(()=>v0100.setMana(3));
   assert.equal(await page.locator('#heroMpBar').getAttribute('aria-valuenow'),'3','combat mana bar updates value');
   await page.evaluate(()=>v0100.setup('Sword'));
   assert.equal(await page.locator('#heroMpBar').count(),0,'no mana bar for non-caster');
   await page.evaluate(()=>v0100.boss());
   const boss=await page.locator('.bossPreview').innerText();
   assert.match(boss,/Abyssal Guardian/);assert.match(boss,/Barrier/);
   if(!desktop){
    const mobileRisk=await page.locator('.combatDecisionPanel').innerText();
    assert.match(mobileRisk,/Abyssal Guardian/);assert.match(mobileRisk,/Barrier/);
   }
   const images=await page.evaluate(async()=>{
    const paths=['abyssal-guardian','rift-harbinger','ember-sovereign'].map(n=>'assets/bosses/'+n+'.png');
    return Promise.all(paths.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({src,width:img.naturalWidth});img.onerror=()=>resolve({src,width:0});img.src=src;})));
   });
   assert(images.every(x=>x.width>0),'all three boss artworks load correctly: '+JSON.stringify(images));

   // v0.10.0 inventory ergonomics and boss wayfinding, tested in a real browser.
   await page.evaluate(()=>v0100.dungeonSelector());
   const milestone=page.locator('.lvbtn.bossDungeon[data-level="10"]');
   assert.equal(await milestone.count(),1,'D10 has boss milestone styling');
   assert.match(await milestone.innerText(),/BOSS/,'boss milestone is explicitly labelled');
   const bossColor=await milestone.evaluate(el=>getComputedStyle(el).borderTopColor);
   assert.notEqual(bossColor,'rgb(0, 0, 0)','boss milestone uses a visible border');
   assert.equal(await page.locator('.dungeonGrid').locator('.token').count(),0,'no duplicate fragment balance in path picker');
   await page.evaluate(()=>v0100.equipment());
   assert.equal(await page.locator('.equipmentInventory .topline .token').count(),0,'header wallet is the only fragment balance');
   if(desktop){
    const position=await page.evaluate(()=>{
     const get=s=>document.querySelector(s).getBoundingClientRect();
     return {paper:get('.equipmentLoadout .paper'),armor:get('.equipmentLoadout [data-slot="armor"]'),boots:get('.equipmentLoadout [data-slot="boots"]'),
      multi:get('#bulkToggle'),clear:get('#resetInventoryFilters'),action:get('.filterActions')};
    });
    assert(position.paper.height<325,'desktop gear panel is compact');
    const slotRects=await page.locator('.equipmentLoadout .slotTile').evaluateAll(nodes=>nodes.map(n=>{
     const r=n.getBoundingClientRect();
     return {slot:n.dataset.slot,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    }));
    assert.equal(slotRects.length,9,'all nine equipment slots rendered');
    for(let i=0;i<slotRects.length;i++)for(let j=i+1;j<slotRects.length;j++){
     const a=slotRects[i],b=slotRects[j],w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
     assert(w<=1||h<=1,'desktop gear slots must not overlap: '+a.slot+' / '+b.slot+' ('+w+'×'+h+')');
    }

    assert(position.boots.top-position.armor.bottom<70,'armor and boots are closer together');
    assert(Math.abs(position.multi.top-position.clear.top)<=2,'Select Multiple and Clear filters share a row');
    assert(position.action.right<=width+1,'filter buttons stay in viewport');
    const grid=page.locator('.equipmentInventory .stashGrid');
    await grid.hover();
    await page.mouse.wheel(0,120);
    await page.waitForTimeout(120);
    const wheel=await grid.evaluate(el=>el.scrollTop);
    assert(wheel>=170,'a discrete mouse wheel step scrolls faster, actual '+wheel);
    const offset=await page.evaluate(()=>{
     const grid=document.querySelector('.equipmentInventory .stashGrid');grid.scrollTop=175;
     grid.querySelector('[data-item]').click();
     return document.querySelector('.equipmentInventory .stashGrid').scrollTop;
    });
    assert(Math.abs(offset-175)<=5,'inventory preserves scroll offset on item selection: '+offset);
   }
   assert.deepEqual(errors,[],'no browser JS errors');
   await page.screenshot({path:'/tmp/wanderer-v0100-'+width+'.png',fullPage:true});
   console.log('PASS v0.10.0 browser '+width+'px: header/menu, mana, boss telegraph, all three PNGs');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>server.close());
