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
globalThis.__bossProbe={
 start(style,speed){
  clockSpeed=speed;
  const boss=BOSS_ARCHETYPES.find(item=>item.style===style);
  state.run={enemy:{boss:true,bossStyle:style,eliteType:null,effect:'burn',name:boss.name}};
  let scene=document.getElementById('scene');
  if(!scene){scene=document.createElement('div');scene.id='scene';document.body.appendChild(scene);}
  scene.innerHTML='<img id="heroPortrait" src="assets/placeholders/sword.svg" alt=""><img id="enemyPortrait" alt="">';
  const img=document.getElementById('enemyPortrait');
  img.dataset.attackSrc=BOSS_ATTACK_ART[style];
  img.dataset.idleSrc=boss.image;
  img.src=boss.image;
  this.startedAt=performance.now();this.impactAt=null;
  const observer=new MutationObserver(records=>{for(const rec of records)for(const node of rec.addedNodes)if(node.classList?.contains('combatVfx'))this.impactAt=performance.now();});
  observer.observe(scene,{childList:true});
  this.observer?.disconnect();this.observer=observer;
  animateEnemyWindup();
  return {src:img.getAttribute('src'),duration:BOSS_ATTACK_DURATION_MS[style]/speed,impact:BOSS_ATTACK_IMPACT_MS[style]/speed,idle:boss.image};
 },
 strike(kind){animateEnemyStrike(kind);},
 status(){const img=document.getElementById('enemyPortrait');return{src:img?.getAttribute('src'),impactAt:this.impactAt,startedAt:this.startedAt};}
};`;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.gif':'image/gif','.mjs':'text/javascript'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://local'),relative=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname.slice(1)),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const content=relative==='index.html'?Buffer.from(source.replace(boot,fixture)):fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(content);}
 catch{res.writeHead(404);res.end('Missing');}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1');
   const cases=width===390?[['guardian',4],['leech',4],['berserker',4]]:[['guardian',1],['leech',2],['berserker',4]];
   for(const [style,speed] of cases){
    const snapshot=await page.evaluate(v=>__bossProbe.start(v[0],v[1]),[style,speed]);
    assert(snapshot.src.includes('_x'+speed+'.gif?play='),'wrong attack speed asset '+snapshot.src);
    await page.evaluate(v=>__bossProbe.strike(v),style==='guardian'?'BossAbyssal':style==='leech'?'BossRift':'BossEmber');
    await page.waitForFunction(()=>__bossProbe.impactAt!==null,null,{timeout:3000});
    const measurements=await page.evaluate(()=>__bossProbe.status()),delta=measurements.impactAt-measurements.startedAt;
    assert(Math.abs(delta-snapshot.impact)<190,style+' x'+speed+' visual contact timing '+delta+' vs '+snapshot.impact);
    await page.waitForFunction(()=>document.querySelector('#enemyPortrait')?.getAttribute('src')?.endsWith('.png'),null,{timeout:3000});
    const src=await page.locator('#enemyPortrait').getAttribute('src');
    assert(src.includes('assets/bosses/'),'static portrait not restored: '+src);
    assert.equal(src,snapshot.idle,'idle no longer matches the boss first attack pose');
    const loaded=await page.locator('#enemyPortrait').evaluate(img=>img.complete&&img.naturalWidth===768&&img.naturalHeight===768);
    assert(loaded,'matching idle PNG failed to load: '+src);
    await page.evaluate(()=>__bossProbe.observer?.disconnect());
   }
   assert.deepEqual(errors,[]);
   console.log('PASS boss animation attacks at '+width+'px');
   await ctx.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
