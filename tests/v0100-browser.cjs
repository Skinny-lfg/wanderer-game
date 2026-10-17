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
 }
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
   assert.equal(await page.locator('#heroMpBar').count(),1,'caster displays mana bar below HP');
   const bar=await page.evaluate(()=>{const hp=document.querySelector('#heroHpFill'),mp=document.querySelector('#heroMpBar');return {hpBottom:hp.getBoundingClientRect().bottom,manaTop:mp.getBoundingClientRect().top}});
   assert(bar.manaTop>=bar.hpBottom-4,'caster mana bar must appear below HP');
   await page.evaluate(()=>{state.run.mp=3;updateBars()});
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
   assert.deepEqual(errors,[],'no browser JS errors');
   await page.screenshot({path:'/tmp/wanderer-v0100-'+width+'.png',fullPage:true});
   console.log('PASS v0.10.0 browser '+width+'px: header/menu, mana, boss telegraph, all three PNGs');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>server.close());
