'use strict';
// Isolated Chromium validation of the three-tier Gothic panel system.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const beforeRoot=process.env.GOTHIC_BEFORE_ROOT?path.resolve(process.env.GOTHIC_BEFORE_ROOT):null;
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
const fixture='phase1Init();render();const phase3RestoredScroll=null;';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.ttf':'font/ttf','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const shots=path.join(root,'docs/v012-gothic-ornament-alignment-screenshots');
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
async function panelScreenshot(page,locator,name){
 if(!(await locator.count()))return;
 const box=await locator.boundingBox();if(!box)return;
 const pageSize=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
 const pad=24,x=Math.max(0,box.x-pad),y=Math.max(0,box.y-pad),right=Math.min(pageSize.width,box.x+box.width+pad),bottom=Math.min(pageSize.height,box.y+box.height+pad);
 await page.screenshot({path:path.join(shots,version,name),type:'jpeg',quality:88,fullPage:true,clip:{x,y,width:right-x,height:bottom-y}});
}
async function runVisuals(browser,mode,width){
 version=mode;
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/?expeditionPhase1=1`);await waitForPanelScript(page);
 await screenshot(page,`camp-${width}.jpg`);
 if(mode==='after'){
  const sharedStats=await page.evaluate(()=>{
   const camp=document.querySelector('.phase3CampStat');
   const cell=document.createElement('div'),stat=document.createElement('div');cell.className='phase3StatCell';stat.className='stat';
   document.body.append(cell,stat);
   const props=['backgroundImage','borderBottomColor','borderBottomStyle','padding'];
   const read=e=>Object.fromEntries(props.map(name=>[name,getComputedStyle(e)[name]]));
   const result={camp:read(camp),cell:read(cell),stat:read(stat)};cell.remove();stat.remove();return result;
  });
  assert.deepEqual(sharedStats.cell,sharedStats.camp,'Between Realms stat cells reuse the Home stat field treatment');
  assert.deepEqual(sharedStats.stat,sharedStats.camp,'Inventory stat fields reuse the Home stat field treatment');
 }
 const stats=page.locator('.phase3CampSideStats'),affinityDialog=page.locator('dialog.phase3InitialAffinityDialog');
 if(mode==='after'){
  const camp=page.locator('.phase3Camp');
  assert(await camp.evaluate(e=>e.classList.contains('gothic-panel--large')),'Camp uses LARGE');
  assert(await stats.evaluate(e=>e.classList.contains('gothic-panel--medium')),'Attributes and Combat Stats use MEDIUM');
  const expeditionPanel=page.locator('.phase3ExpeditionPanel');
  assert.equal(await expeditionPanel.evaluate(e=>getComputedStyle(e).overflow),'visible','Expedition shell does not clip lower ornaments');
  const largeCorners=await camp.evaluate(e=>{const r=e.getBoundingClientRect();return[...e.querySelectorAll(':scope > .gothic-corner-layer img')].map(img=>{const b=img.getBoundingClientRect();return{classes:img.className,top:b.top,right:b.right,bottom:b.bottom,left:b.left,panel:{top:r.top,right:r.right,bottom:r.bottom,left:r.left}}})});
  assert.equal(largeCorners.length,4,'LARGE panel has four corner ornaments');
  for(const c of largeCorners){
   if(c.classes.includes('--tl'))assert(c.left<c.panel.left&&c.top<c.panel.top,'LARGE top-left ornament extends outside the frame');
   if(c.classes.includes('--tr'))assert(c.right>c.panel.right&&c.top<c.panel.top,'LARGE top-right ornament extends outside the frame');
   if(c.classes.includes('--bl'))assert(c.left<c.panel.left&&c.bottom>c.panel.bottom,'LARGE bottom-left ornament extends outside the frame');
   if(c.classes.includes('--br'))assert(c.right>c.panel.right&&c.bottom>c.panel.bottom,'LARGE bottom-right ornament extends outside the frame');
  }
  const panel=await stats.evaluate(e=>({background:getComputedStyle(e).backgroundImage,border:getComputedStyle(e).borderTopWidth,corners:e.querySelectorAll(':scope > .gothic-corner-layer img').length,shadow:getComputedStyle(e).boxShadow}));
  assert.equal(panel.corners,4);assert.equal(panel.border,'1px');assert(panel.background.includes('linear-gradient'),'Stats retains dark panel background');
  const geometry=await stats.evaluate(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e),imgs=[...e.querySelectorAll(':scope > .gothic-corner-layer img')];return{overflow:cs.overflow,borderColor:cs.borderTopColor,rect:{top:r.top,right:r.right,bottom:r.bottom,left:r.left},corners:imgs.map(img=>{const b=img.getBoundingClientRect();return{classes:img.className,rect:{top:b.top,right:b.right,bottom:b.bottom,left:b.left},position:{top:getComputedStyle(img).top,right:getComputedStyle(img).right,bottom:getComputedStyle(img).bottom,left:getComputedStyle(img).left}}})}});
  assert.equal(geometry.overflow,'visible','the decorated shell does not clip its ornaments');
  assert(geometry.borderColor!=='rgba(0, 0, 0, 0)','the continuous gold panel border remains present');
  for(const corner of geometry.corners){
   if(corner.classes.includes('--tl'))assert(corner.rect.left<geometry.rect.left&&corner.rect.top<geometry.rect.top,'top-left ornament is mounted beyond the frame');
   if(corner.classes.includes('--tr'))assert(corner.rect.right>geometry.rect.right&&corner.rect.top<geometry.rect.top,'top-right ornament is mounted beyond the frame');
   if(corner.classes.includes('--bl'))assert(corner.rect.left<geometry.rect.left&&corner.rect.bottom>geometry.rect.bottom,'bottom-left ornament is mounted beyond the frame');
   if(corner.classes.includes('--br'))assert(corner.rect.right>geometry.rect.right&&corner.rect.bottom>geometry.rect.bottom,'bottom-right ornament is mounted beyond the frame');
   assert(Object.values(corner.position).some(value=>value.startsWith('-')),'corner positions use calibrated negative offsets');
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`horizontal overflow ${width}`);
 }
 await panelScreenshot(page,stats,`attributes-${width}.jpg`);
 await panelScreenshot(page,page.locator('.phase3ExpeditionPanel'),`expedition-${width}.jpg`);
 await page.locator('[data-phase3-nav="equipment"]').click();
 await page.locator('.equipmentInventory').waitFor({state:'visible'});
 await waitForPanelScript(page);
 await panelScreenshot(page,page.locator('.equipmentOverview'),`equipment-${width}.jpg`);
 await panelScreenshot(page,page.locator('.equipmentInventory'),`inventory-${width}.jpg`);
 if(mode==='after'){
  for(const selector of ['.equipmentOverview','.equipmentInventory']){
   const panel=page.locator(selector);
   assert(await panel.evaluate(e=>e.classList.contains('gothic-panel--large')),`${selector} uses LARGE`);
   const result=await panel.evaluate(e=>({overflow:getComputedStyle(e).overflow,corners:e.querySelectorAll(':scope > .gothic-corner-layer img').length}));
   assert.equal(result.overflow,'visible',`${selector} does not clip its ornament`);assert.equal(result.corners,4,`${selector} has four corners`);
  }
  const inventorySurfaces=await page.evaluate(()=>{
   const selectors=['.equipmentOverview','.equipmentInventory .stashGrid','.equipmentInventory .stashCapacityBar','.inventoryJumpNav'];
   return Object.fromEntries(selectors.map(selector=>{const el=document.querySelector(selector),s=getComputedStyle(el);return[selector,{backgroundImage:s.backgroundImage,backgroundColor:s.backgroundColor,borderColor:s.borderTopColor}]}));
  });
  const reference=inventorySurfaces['.equipmentOverview'];
  for(const selector of ['.equipmentInventory .stashGrid','.equipmentInventory .stashCapacityBar','.inventoryJumpNav']){
   assert.equal(inventorySurfaces[selector].backgroundImage,reference.backgroundImage,`${selector} matches the Home panel fill`);
  }
  assert.equal(inventorySurfaces['.equipmentInventory .stashGrid'].borderColor,inventorySurfaces['.equipmentInventory .stashCapacityBar'].borderColor,'Inventory inner surfaces share the same restrained border');
  assert.equal(inventorySurfaces['.equipmentInventory .stashGrid'].borderColor,inventorySurfaces['.inventoryJumpNav'].borderColor,'Inventory navigation matches its inner surface border');
 }
 await page.locator('[data-phase3-nav="city-center"]').click();
 const city=page.locator('.phase3CityCenter');await city.waitFor({state:'visible'});await waitForPanelScript(page);
 await panelScreenshot(page,city,`city-center-${width}.jpg`);
 if(mode==='after'){
  assert(await city.evaluate(e=>e.classList.contains('gothic-panel--large')),'City Center uses LARGE');
  assert.equal(await city.evaluate(e=>getComputedStyle(e).overflow),'visible','City Center does not clip its ornament');
 }
 await page.locator('[data-phase3-nav="phase1"]').click();
 await page.locator('.phase3Camp').waitFor({state:'visible'});await waitForPanelScript(page);
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
  const tab=page.locator('.phase3BetweenTabs [role="tab"]');await page.waitForFunction(()=>document.querySelector('.phase3BetweenTabs [role="tab"]')?.classList.contains('gothic-button-ornamented'));
  assert(await tab.first().evaluate(e=>!e.classList.contains('gothic-panel--small')),'SMALL ornament layer does not restyle the button as a panel');
  const buttonStyle=await tab.first().evaluate(e=>{const s=getComputedStyle(e);return{clipPath:s.clipPath,webkitClipPath:s.webkitClipPath,borderRadius:s.borderRadius,minHeight:s.minHeight,layerZ:getComputedStyle(e.querySelector(':scope > .gothic-corner-layer')).zIndex}});
  assert.equal(buttonStyle.clipPath,'none','ornamented buttons are rectangular and are not chamfer-clipped');
  assert.equal(buttonStyle.webkitClipPath,'none','Safari does not clip ornamented buttons');
  assert.equal(buttonStyle.borderRadius,'0px','ornamented buttons have square corners beneath the PNG overlay');
  assert.equal(buttonStyle.minHeight,'42px','conventional buttons share the Home navigation height');
  assert.equal(buttonStyle.layerZ,'0','the PNG corner overlay sits above the button fill');
  assert.equal(await tab.first().locator(':scope > .gothic-corner-layer img').count(),4,'SMALL button uses four corner overlays');
  assert.equal(await tab.first().locator(':scope > .gothic-corner-layer').evaluate(e=>getComputedStyle(e).pointerEvents),'none','button ornaments never block clicks');
  const small=await tab.first().locator(':scope > .gothic-corner-layer img').first().evaluate(e=>({src:e.getAttribute('src'),ratio:e.naturalWidth/e.naturalHeight}));assert(small.src.includes('small-silver-tr.png')&&Math.abs(small.ratio-1)<.01,'SMALL uses undistorted silver asset');
  const smallGeometry=await tab.first().evaluate(e=>{const r=e.getBoundingClientRect();return[...e.querySelectorAll(':scope > .gothic-corner-layer img')].map(img=>{const b=img.getBoundingClientRect();return{classes:img.className,top:b.top,right:b.right,bottom:b.bottom,left:b.left,panel:{top:r.top,right:r.right,bottom:r.bottom,left:r.left}}})});
  for(const c of smallGeometry)assert(c.left>=c.panel.left&&c.right<=c.panel.right&&c.top>=c.panel.top&&c.bottom<=c.panel.bottom,'SMALL button ornaments stay within the existing control box');
  await screenshot(page,`small-controls-${width}.jpg`);
 }
 assert.deepEqual(errors,[],'browser has no page errors');
 await page.close();console.log(`PASS Gothic tiers ${mode} ${width}px`);
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1440]){if(beforeRoot)await runVisuals(browser,'before',width);await runVisuals(browser,'after',width)}}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
