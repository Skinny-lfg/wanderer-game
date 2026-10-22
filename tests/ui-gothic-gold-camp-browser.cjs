'use strict';
// Camp-only Gothic Gold visual and interaction check using the isolated v0.12 preview.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot));
const fixture='phase1Init();render();const phase3RestoredScroll=null;';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml'};
const screenshots=path.join(root,'docs/ui-gothic-gold-screenshots/after');fs.mkdirSync(screenshots,{recursive:true});
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,url.pathname==='/'?'index.html':'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
  let body;try{body=fs.readFileSync(file)}catch{res.writeHead(404);return res.end('missing')}
  if(url.pathname==='/')body=Buffer.from(source.replace(boot,fixture));
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  try{
    for(const [width,height] of [[375,812],[430,932],[768,1024],[1440,900],[1920,1080]]){
      const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/?expeditionPhase1=1`);
      const camp=page.locator('.phase3Camp'),hero=page.locator('.phase3CampCharacter'),stats=page.locator('.phase3CampSideStats'),expedition=page.locator('.phase3ExpeditionPanel');
      assert.equal(await page.locator('.phase3CampCharacter .paper>.slotTile[data-slot]').count(),10);
      assert.equal(await page.locator('.phase3CampCharacter .phase3PotionSlots>.phase3PotionSlot').count(),3);
      for(const label of ['Strength','Agility','Intellect','Endurance','Charisma','Attack','Defense','Health','Crit','Gear Power'])assert((await stats.textContent()).includes(label),`missing Camp stat ${label} at ${width}`);
      const geometry=await page.evaluate(()=>{
        const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
        const frames=[...document.querySelectorAll('.phase3Camp .rarityImageFrame')].map(x=>{const r=x.getBoundingClientRect();return[Math.abs(r.width-r.height),r.width,r.height]});
        return{camp:rect('.phase3Camp'),intro:rect('.phase3CampStatus'),hero:rect('.phase3CampCharacter'),stats:rect('.phase3CampSideStats'),expedition:rect('.phase3ExpeditionPanel'),journey:rect('.phase3CampSidebarJourney'),slots:[...document.querySelectorAll('.phase3CampCharacter .paper>.slotTile[data-slot]')].map(x=>{const r=x.getBoundingClientRect();return{slot:x.dataset.slot,x:r.x,y:r.y,w:r.width,h:r.height}}),potions:[...document.querySelectorAll('.phase3CampCharacter .phase3PotionSlot')].map(x=>{const r=x.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}),frames,theme:getComputedStyle(document.body).getPropertyValue('--gothic-antique-gold').trim(),resource:getComputedStyle(document.querySelector('.phase3Camp .phase3ResourceTrack')).borderColor};
      });
      assert.equal(geometry.theme,'#9e7d44');assert.equal(geometry.slots.length,10);assert.equal(geometry.potions.length,3);
      assert(geometry.frames.every(([delta,w,h])=>delta<1&&w>0&&h>0),'rarity frame distorted');
      assert(geometry.slots.every(x=>x.w>=44&&x.h>=44),'equipment hit target too small');
      assert(geometry.potions.every(x=>x.w>=44&&x.h>=44),'potion hit target too small');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`horizontal overflow at ${width}`);
      if(width>1150){assert(geometry.stats.x<geometry.hero.x&&geometry.hero.x<geometry.expedition.x,'desktop Camp columns out of order')}
      else if(width<=700){assert(geometry.intro.y<geometry.hero.y&&geometry.hero.y<geometry.stats.y&&geometry.stats.y<geometry.expedition.y&&geometry.expedition.y<geometry.journey.y,'mobile Camp order incorrect')}
      const hps=await page.locator('.phase3Camp .phase3Resource[aria-label="Health"], .phase3Camp .phase3Resource').count();assert(hps>=1);
      const start=page.locator('.phase3Start').first();assert(await start.isVisible());
      if(width<=700){const sticky=page.locator('.phase3CampStickyStart .phase3Start');assert.equal(await sticky.isVisible(),false,'sticky Start should yield while it would cover controls');await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(80);assert(await sticky.isVisible(),'mobile sticky Start not visible in a clear viewport band');await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(80)}
      await page.screenshot({path:path.join(screenshots,`camp-${width}.jpg`),type:'jpeg',quality:82,fullPage:true});
      const equipped=page.locator('.phase3CampCharacter .slotTile.filled').first();if(await equipped.count()){await equipped.click();assert(await page.locator('dialog.equipmentItemDialog').isVisible(),'equipped item action did not open details');await page.locator('dialog.equipmentItemDialog').evaluate(el=>el.close())}
      await page.locator('[data-phase3-nav="equipment"]').click();assert.equal(await page.locator('.equipmentOverview .slotTile').count(),10);await page.locator('[data-phase3-nav="phase1"]').click();assert(await camp.isVisible(),'navigation did not return to Camp');
      assert.deepEqual(errors,[]);await page.close();console.log(`PASS Gothic Gold Camp ${width}×${height}`);
    }
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
