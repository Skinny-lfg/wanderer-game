'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot),'app bootstrap must be stable for the visual fixture');
const fixture='phase1Init();\nconst phase3RestoredScroll=null;\nrender();';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.gif':'image/gif','.mjs':'text/javascript'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://local'),rel=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1)),file=path.resolve(root,rel);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 try{const body=rel==='index.html'?Buffer.from(source.replace(boot,fixture)):fs.readFileSync(file);
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(body);}
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
   const result=await page.evaluate(()=>{
    document.body.classList.add('phase3IntegratedPreview','phase3CombatView');
    const container=document.createElement('section');
    container.className='combatLayout';
    container.innerHTML='<div class="panel"><div class="topline"><p class="muted">Wave 4 · Boss</p></div><div class="scene" id="visualTestScene"><img class="phase3ArenaBackdrop" src="assets/dungeons/c3/blood_bloodscar_wastes.webp" alt=""><div class="combatant eliteCombatant"><img id="enemyPortrait" data-elite-type="caster" src="assets/elites/animated/caster_idle.png" alt=""><strong class="combatEnemyName eliteName">Voidborne Hexer</strong><small>ATK 120 · DEF 90</small><small id="enemyHpText">600 / 700</small></div></div></div>';
    document.body.appendChild(container);
    const scene=container.querySelector('.scene');
    scene.id='scene';
    const art=scene.querySelector('.phase3ArenaBackdrop'),enemy=scene.querySelector('#enemyPortrait');
    const caster=getComputedStyle(enemy),artStyle=getComputedStyle(art);
    const casterWidth=enemy.getBoundingClientRect().width;
    enemy.dataset.eliteType='vampire';
    const vampire=getComputedStyle(enemy),vampireWidth=enemy.getBoundingClientRect().width;
    const hpStyle=getComputedStyle(scene.querySelector('#enemyHpText'));
    const passive=phase3PassiveDescriptionHtml('Deal 24% damage with a 3s cooldown on the next attack.');
    return {casterTransform:caster.transform,casterWidth,vampireWidth,
      backgroundOpacity:artStyle.opacity,backgroundFilter:artStyle.filter,
      hpFontSize:parseFloat(hpStyle.fontSize),hpColor:hpStyle.color,passive};
   });
   assert(result.casterTransform.includes('-1'),'elite caster must be mirrored: '+result.casterTransform);
   assert(result.vampireWidth<result.casterWidth,'Sanguine Wraith must be smaller than the Caster');
   assert.equal(result.backgroundOpacity,'0.72');
   assert(result.backgroundFilter.includes('brightness(0.6)'));
   assert(result.hpFontSize>=14,'combat HP text must remain readable');
   assert(result.passive.includes('phase3PassiveEmphasis--number')&&result.passive.includes('phase3PassiveEmphasis--effect'));
   assert(!result.passive.includes('<script'),'passive descriptions must stay escaped');
   assert.deepEqual(errors,[],'browser script errors');
   console.log('PASS combat visual clarity '+width+'px: mirrored Caster, smaller Wraith, darker arena, readable HP, emphasized passives');
   await ctx.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
