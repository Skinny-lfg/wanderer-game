'use strict';
// Isolated browser fixture: uses synthetic boss state, no player saves, network auth or combat simulation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot));

const fixture=`phase1Init();
const phase3RestoredScroll=null;
render();
globalThis.__statusIconIds=[...STATUS_ICON_FILES];
globalThis.__statusIconArt=statusArt;
globalThis.__openAuditModal=()=>showModal('Equipment','<p>Gear detail sample</p><button id="popupInnerButton">Action</button>');
`;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.gif':'image/gif','.mjs':'text/javascript'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),relative=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1)),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const data=relative==='index.html'?Buffer.from(source.replace(boot,fixture)):fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);}
 catch{res.writeHead(404);res.end('Missing');}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1');
   await page.evaluate(()=>{
    const host=document.createElement('div');
    host.id='statusIconAudit';host.className='scene';
    host.style.cssText='position:fixed;top:0;left:0;width:340px;height:130px;z-index:9999;background:#100b10;';
    const icons=__statusIconIds.map(key=>__statusIconArt(key)).join('');
    host.innerHTML='<div class="combatStatuses" style="display:flex;flex-wrap:wrap;max-height:none;height:auto;overflow:visible">'+icons+'</div>';
    document.body.appendChild(host);
   });
   await page.waitForFunction(()=>[...document.querySelectorAll('#statusIconAudit .statusIcon')].length===38 && [...document.querySelectorAll('#statusIconAudit .statusIcon')].every(img=>img.complete&&img.naturalWidth>0&&img.naturalHeight>0),null,{timeout:10000});
   const icons=await page.locator('#statusIconAudit .statusIcon').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('src'),naturalWidth:i.naturalWidth,fit:getComputedStyle(i).objectFit})));
   assert.equal(icons.length,38);
   assert(icons.every(i=>i.src.startsWith('assets/status/icons/')&&i.fit==='contain'&&i.naturalWidth>0),'icon asset missing or distorted');
   await page.locator('#statusIconAudit').evaluate(e=>e.remove());
   // Synthetic combat HUD for the player and enemy, including stacked effects.
   await page.evaluate(()=>{
    const scene=document.createElement('div');
    scene.id='scene';scene.className='scene';scene.style.cssText='position:fixed;top:0;left:0;width:min(100vw,380px);height:280px;min-height:280px;z-index:9999;';
    for(const kind of ['playerStatuses','enemyDebuffs']){
     const actor=document.createElement('div');actor.className='combatant';
     actor.style.cssText='position:relative;min-width:0;';
     const lane=document.createElement('div');
     lane.className='combatStatuses '+kind;
     lane.innerHTML=[['barrier','Barrier 150'],['weakened','Weakened −20% damage'],['healing-reduction','Healing −40%'],['boss-barrier','Boss Barrier 200']]
      .map(([id,name])=>'<span class="debuff statusPositive">'+__statusIconArt(id)+' '+name+'</span>').join('');
     actor.appendChild(lane);scene.appendChild(actor);
    }
    document.body.appendChild(scene);
   });
   const measurements=await page.locator('#scene .combatant').evaluateAll(actors=>actors.map(actor=>{
    const lane=actor.querySelector('.combatStatuses'),badge=lane.querySelector('.debuff'),img=badge.querySelector('img');
    const ls=getComputedStyle(lane),bs=getComputedStyle(badge),is=getComputedStyle(img),lr=lane.getBoundingClientRect(),ar=actor.getBoundingClientRect();
    return {font:parseFloat(bs.fontSize),iconW:parseFloat(is.width),iconH:parseFloat(is.height),
     minBadgeHeight:parseFloat(bs.minHeight),hasOwnScroll:ls.overflowY==='auto',
     laneTop:lr.top,laneBottom:lr.bottom,laneWidth:lr.width,actorWidth:ar.width,
     laneHeight:lr.height,actorHeight:ar.height,fit:is.objectFit};
   }));
   const minFont=width<=650?12:14,minIcon=width<=650?21:26;
   assert.equal(measurements.length,2);
   for(const m of measurements){
    assert(m.font>=minFont&&m.iconW>=minIcon&&m.iconH>=minIcon,'combat effect below intended readability: '+JSON.stringify(m));
    assert(m.fit==='contain','combat icon should preserve its proportions');
    assert(m.hasOwnScroll&&m.laneHeight<=m.actorHeight*.57,'status lane must scroll inside combatant: '+JSON.stringify(m));
    assert(m.laneWidth<=m.actorWidth+1,'status lane must not overflow the combatant: '+JSON.stringify(m));
   }
   await page.locator('#scene').evaluate(e=>e.remove());

   await page.evaluate(()=>__openAuditModal());
   const dialog=page.locator('dialog[open]');
   await dialog.waitFor();
   await page.waitForFunction(()=>document.querySelector('dialog[open]')&&!document.querySelector('dialog[open] > .gothic-corner-layer'),null,{timeout:3000});
   const bounds=await dialog.evaluate(d=>{const r=d.getBoundingClientRect(),style=getComputedStyle(d);return {
    cornerLayers:d.querySelectorAll(':scope > .gothic-corner-layer').length,
    centeredX:Math.abs((r.left+r.right)/2-innerWidth/2),
    centeredY:Math.abs((r.top+r.bottom)/2-innerHeight/2),
    border:style.borderTopStyle,padding:style.paddingTop,width:r.width,height:r.height
   };});
   assert.equal(bounds.cornerLayers,0,'popup frame includes forbidden decorative corners');
   assert(bounds.centeredX<2&&bounds.centeredY<2,'popup shifted outside viewport '+JSON.stringify(bounds));
   assert(bounds.border==='solid','popup no longer has its CSS frame');
   assert(bounds.width<width&&bounds.height<900,'popup exceeds viewport bounds');
   await dialog.locator('[data-close]').click();
   assert.deepEqual(errors,[],'page errors');
   console.log('PASS '+width+'px: all 38 status PNGs load; larger combat status labels and icons; no popup corners');
   await ctx.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(err=>{console.error(err);process.exitCode=1;});
