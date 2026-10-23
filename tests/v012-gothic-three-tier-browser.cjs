'use strict';
// Isolated Chromium validation of the three-tier Gothic panel system.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const beforeRoot=process.env.GOTHIC_BEFORE_ROOT?path.resolve(process.env.GOTHIC_BEFORE_ROOT):null;
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
const fixture='phase1Init();render();const phase3RestoredScroll=null;';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const shots=path.join(root,'docs/v012-gothic-three-tier-screenshots');
fs.mkdirSync(path.join(shots,'before'),{recursive:true});fs.mkdirSync(path.join(shots,'after'),{recursive:true});
let version='after';
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),relative=url.pathname==='/'?'index.html':url.pathname.slice(1),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('forbidden')}
 const serveRoot=version==='before'&&beforeRoot?beforeRoot:root,serveFile=path.resolve(serveRoot,relative);
 if(!serveFile.startsWith(serveRoot+path.sep)){res.writeHead(403);return res.end('forbidden')}
 let body;try{body=fs.readFileSync(serveFile)}catch{res.writeHead(404);return res.end('missing')}
 if(relative==='index.html')body=Buffer.from(body.toString('utf8').replace(boot,fixture));
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);
});

async function waitForPanelScript(page){await page.waitForFunction(()=>document.querySelector('link[data-gothic-corner-system]')&&[...document.styleSheets].some(s=>s.href?.includes('v012-gothic-panels.css')));await page.waitForTimeout(100)}
async function screenshot(page,name){await page.screenshot({path:path.join(shots,version,name),type:'jpeg',quality:84,fullPage:true})}
async function runVisuals(browser,mode,width){
 version=mode;
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?expeditionPhase1=1`);await waitForPanelScript(page);
 await screenshot(page,`camp-${width}.jpg`);
 const stats=page.locator('.phase3CampSideStats'),affinityDialog=page.locator('dialog.phase3InitialAffinityDialog');
 if(mode==='after'){
  const camp=page.locator('.phase3Camp');
  assert(await camp.evaluate(e=>e.classList.contains('gothic-panel--large')),'Camp uses LARGE');
  assert(await stats.evaluate(e=>e.classList.contains('gothic-panel--medium')),'Attributes and Combat Stats use MEDIUM');
  const panel=await stats.evaluate(e=>({background:getComputedStyle(e).backgroundImage,border:getComputedStyle(e).borderTopWidth,corners:e.querySelectorAll(':scope > .gothic-corner-layer img').length,shadow:getComputedStyle(e).boxShadow}));
  assert.equal(panel.corners,4);assert.equal(panel.border,'1px');assert(panel.background.includes('linear-gradient'),'Stats retains dark panel background');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`horizontal overflow ${width}`);
 }
 const start=page.locator('.phase3ExpeditionPanel .phase3Start');
 if(await start.count()){
  await start.click();const affinity=page.locator('dialog.phase3InitialAffinityDialog');await affinity.waitFor({state:'visible'});
  await screenshot(page,`initial-affinity-${width}.jpg`);
  if(mode==='after'){
   assert(await affinity.evaluate(e=>e.classList.contains('gothic-panel--medium')),'Initial Affinity uses MEDIUM');
   const layout=await page.locator('.phase3AffinityChoice').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y}}));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Affinity overflow ${width}`);
   if(width<=650){assert.equal(new Set(layout.map(x=>Math.round(x.y))).size,2,'mobile affinity cards form two rows');assert.equal(new Set(layout.map(x=>Math.round(x.x))).size,3,'mobile affinity cards form three columns')}
   else assert.equal(new Set(layout.map(x=>Math.round(x.y))).size,1,'desktop affinity cards form one row');
  }
  const magic=page.locator('[data-phase2-initial="magic"]');if(await magic.count()){
   await magic.click();const element=page.locator('dialog.phase3MagicElementDialog');await element.waitFor({state:'visible'});await screenshot(page,`magic-element-${width}.jpg`);
   if(mode==='after'){
    assert(await element.evaluate(e=>e.classList.contains('gothic-panel--medium')),'Magic Element uses MEDIUM');
    assert.equal(await element.locator('.phase3MagicElementChoice').count(),3);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Magic Element overflow ${width}`);
    const art=await element.locator('.magicChoiceIcon').first().evaluate(e=>({fit:getComputedStyle(e).objectFit,ratio:e.naturalWidth/e.naturalHeight}));assert.equal(art.fit,'contain');assert(art.ratio>0.98&&art.ratio<1.02,'Magic icons preserve source ratio');
   }
  }
 }
 if(mode==='after'){
  const corners=await affinityDialog.locator(':scope > .gothic-corner-layer img').evaluateAll(es=>es.map(e=>({corner:[...e.classList].find(c=>c.startsWith('gothic-corner--')),src:e.getAttribute('src'),ratio:e.naturalWidth/e.naturalHeight,transform:getComputedStyle(e).transform,pointer:getComputedStyle(e).pointerEvents})));
  assert.equal(corners.length,4,'MEDIUM has four independent corner PNGs');
  assert(corners.every(c=>c.src.includes('medium-gold-tr.png')&&c.pointer==='none'&&Math.abs(c.ratio-1.03)<.03),'MEDIUM uses original uncropped PNG at intrinsic ratio');
  assert(corners.find(c=>c.corner.endsWith('--tr')).transform==='none','top-right keeps the original orientation');
  assert(corners.find(c=>c.corner.endsWith('--tl')).transform==='matrix(-1, 0, 0, 1, 0, 0)','top-left mirrors horizontally');
  assert(corners.find(c=>c.corner.endsWith('--br')).transform==='matrix(1, 0, 0, -1, 0, 0)','bottom-right mirrors vertically');
  assert(corners.find(c=>c.corner.endsWith('--bl')).transform==='matrix(-1, 0, 0, -1, 0, 0)','bottom-left mirrors both axes');
  await page.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(e=>e.close());const nav=document.createElement('nav');nav.className='phase3BetweenTabs';nav.style.cssText='position:fixed;z-index:90;left:12px;bottom:12px;display:flex;gap:8px;padding:8px;background:#151318';nav.innerHTML='<button role="tab">Gear</button><button role="tab">Stats</button><button role="tab">Loot</button>';document.body.append(nav)});
  const tab=page.locator('.phase3BetweenTabs [role="tab"]');await page.waitForFunction(()=>document.querySelector('.phase3BetweenTabs [role="tab"]')?.classList.contains('gothic-panel--small'));
  assert.equal(await tab.first().locator(':scope > .gothic-corner-layer img').count(),4,'SMALL button uses four corner overlays');
  const small=await tab.first().locator(':scope > .gothic-corner-layer img').first().evaluate(e=>({src:e.getAttribute('src'),ratio:e.naturalWidth/e.naturalHeight}));assert(small.src.includes('small-silver-tr.png')&&Math.abs(small.ratio-1)<.01,'SMALL uses undistorted silver asset');
  await screenshot(page,`small-controls-${width}.jpg`);
 }
 assert.deepEqual(errors,[],'browser has no page errors');
 await page.close();console.log(`PASS Gothic tiers ${mode} ${width}px`);
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1440]){if(beforeRoot)await runVisuals(browser,'before',width);await runVisuals(browser,'after',width)}}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
