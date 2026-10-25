'use strict';
// Isolated browser fixture: uses synthetic mob/elite state, no player saves, network auth or combat simulation.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot));
const fixture=`phase1Init();
const phase3RestoredScroll=null;
render();
globalThis.__speedProbe={
 start(category,key,speed){
  clockSpeed=speed;
  const elite=category==='elite';
  const enemy=elite?{boss:false,eliteType:key,role:'miniboss',effect:'burn'}:
    {boss:false,eliteType:null,role:key==='caster'?'caster':'skirmisher',effect:'burn'};
  const src=elite?ELITE_ATTACK_ART[key]:MOB_POOLS[key==='caster'?'temple':'bloodscar'][key==='caster'?1:0][1];
  const idle=elite?ELITE_ART[key]:src.replace(/\.gif$/,'.png');
  state.run={enemy};
  let scene=document.getElementById('scene');
  if(!scene){scene=document.createElement('div');scene.id='scene';document.body.appendChild(scene);}
  scene.innerHTML='<img id="heroPortrait" src="assets/placeholders/sword.svg" alt=""><img id="enemyPortrait" alt="">';
  const img=document.getElementById('enemyPortrait');
  img.dataset.attackSrc=src;img.dataset.idleSrc=idle;img.src=idle;
  this.observer?.disconnect();
  this.startedAt=performance.now();this.impactAt=null;
  this.observer=new MutationObserver(records=>{
   for(const rec of records)for(const node of rec.addedNodes)
    if(node.classList?.contains('combatVfx'))this.impactAt=performance.now();
  });
  this.observer.observe(scene,{childList:true});
  animateEnemyWindup();
  return {src:img.getAttribute('src'),idle,
   duration:(elite?ELITE_ATTACK_DURATION_MS[key]:1570)/speed,
   impact:(elite?ELITE_ATTACK_IMPACT_MS[key]:660)/speed};
 },
 strike(){animateEnemyStrike();},
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
   const cases=width===390?
    [['mob','skirmisher',4],['mob','caster',2],['elite','berserker',4],['elite','tank',2]]:
    [['mob','skirmisher',1],['mob','caster',4],['elite','caster',1],['elite','vampire',4]];
   for(const [category,key,speed] of cases){
    const snapshot=await page.evaluate(v=>__speedProbe.start(v[0],v[1],v[2]),[category,key,speed]);
    const expected=speed===1?/\.gif\?play=/:new RegExp('_x'+speed+'\\.gif\\?play=');
    assert(expected.test(snapshot.src),'wrong animation variant '+snapshot.src);
    await page.evaluate(()=>__speedProbe.strike());
    await page.waitForFunction(()=>__speedProbe.impactAt!==null,null,{timeout:3000});
    const measurements=await page.evaluate(()=>__speedProbe.status()),delta=measurements.impactAt-measurements.startedAt;
    assert(Math.abs(delta-snapshot.impact)<200,category+' '+key+' x'+speed+' contact '+delta+' vs '+snapshot.impact);
    await page.waitForFunction(()=>document.querySelector('#enemyPortrait')?.getAttribute('src')?.endsWith('.png'),null,{timeout:4000});
    const src=await page.locator('#enemyPortrait').getAttribute('src');
    assert.equal(src,snapshot.idle,'idle not restored '+category+' '+key+' x'+speed);
    await page.evaluate(()=>__speedProbe.observer?.disconnect());
    console.log('PASS '+category+' '+key+' x'+speed+' at '+width+'px: impact '+Math.round(delta)+'ms and idle');
   }
   assert.deepEqual(errors,[]);
   console.log('PASS mob and elite animation speeds at '+width+'px');
   await ctx.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
