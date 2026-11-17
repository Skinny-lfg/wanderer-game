'use strict';
// Stage 4.5.4: real Chromium, isolated local-save preview. Never opens a cloud session.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const out=path.resolve('reports/stage45-4-browser');fs.mkdirSync(out,{recursive:true});
const findings=[];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2'};
const hook=String.raw\`
window.__stage454={
 snapshot(){const g=phase1Controller.state,d=g.dungeon||null,c=d?.realm?phase1Controller.realmMap():null,r=state.run;
  return {stage:g.stage,expedition:g.expedition,realm:d?.realm??null,steps:d?.steps??null,current:d?.current??null,
   cards:d?.cards?.map(c=>({id:c.id,level:c.risk,name:c.name,objective:c.objective,reliquary:c.reliquaryRoom,oracle:c.nodes.findIndex(n=>n.event==='oracle_of_paths'),boss:c.nodes.length-1,edges:c.edges,nodes:c.nodes.map(n=>({kind:n.kind,event:n.event||null,traitId:n.traitId||null}))}))||[],
   preparation:d?.foundationState?.bossPreparation||null,knownMods:d?.foundationState?.revealedBossModifiers||[],disabledId:d?.disabledBossModifierId||null,
   runStatus:r?.status||null,runModifiers:r?.bossModifierIds||[],runBoss:r?.enemy?.boss||false,runEscorts:r?.totalMobCount?Math.max(0,r.totalMobCount-1):null,
   hp:phase3Vitals()?.hp, maxHp:phase3Vitals()?.maxhp, mp:phase3Vitals()?.mp, maxMp:phase3Vitals()?.maxmp,
   savedTalents:state.automaticTalents?.nodes||[],
   result:phase5Results.summary?.outcome||null};
 },
 finishCombat(){const r=state.run;if(!r||r.status!=='fight')return {status:r?.status||null};
  for(let n=0;n<90&&r.status==='fight';n++){
   // Only a test accelerator: preserve actual victory settlement, rewards and phases.
   for(const mob of r.enemies?.length?r.enemies:[r.enemy])if(mob&&mob.hp>0)mob.hp=0;
   phase1WaveWon();
  }
  return {status:r.status,stage:phase1Controller.state.stage};
 }
};
\`;
async function main(){
 const root=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8',maxBuffer:2*1024*1024}).trim().replace(/^Isolated automatic RPG preview: /,'');
 const entry=path.join(root,'index.html');let html=fs.readFileSync(entry,'utf8');
 const anchor='phase1Init();\nconst phase3RestoredScroll';assert.equal(html.split(anchor).length,2,'Unknown v0.13 boot; do not inject QA hook into the wrong version');
 html=html.replace(anchor,'phase1Init();\n'+hook+'\nconst phase3RestoredScroll');fs.writeFileSync(entry,html);
 const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.statusCode=400;return res.end();}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
  fs.readFile(file,(err,body)=>{if(err){res.statusCode=404;return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(body);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const opts={headless:true,args:['--no-sandbox']};if(process.env.CHROMIUM_PATH)opts.executablePath=process.env.CHROMIUM_PATH;
 let browser;
 try{
  browser=await chromium.launch(opts);
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1}),errors=[];
  page.setDefaultTimeout(12000);page.on('pageerror',err=>errors.push(String(err)));
  page.on('console',msg=>{if(msg.type()==='error'&&!/Failed to load resource/.test(msg.text()))findings.push('Browser console error: '+msg.text().slice(0,300));});
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.locator('.phase3Camp').waitFor({state:'visible'});
  assert.equal((await page.evaluate(()=>__stage454.snapshot())).stage,'camp');
  await page.screenshot({path:path.join(out,'01-camp-desktop.png'),fullPage:true});
  // Real current Talent Tree is hosted in an iframe; old inline-graph selectors must not be used.
  await page.getByRole('button',{name:'Talents',exact:true}).click();
  const atlas=page.frameLocator('iframe[title="Talent tree"]');
  await atlas.locator('#nodes .node').first().waitFor();
  const count=await atlas.locator('#nodes .node').count();assert(count>=200,'Expected native v15 atlas, not the historical inline tree');
  for(const id of ['root_blood','root_decay','root_vitality','root_aegis','root_fury','root_magic'])assert.equal(await atlas.locator('[data-id="'+id+'"]').count(),1,'Missing '+id);
  await atlas.locator('#families button').filter({hasText:'Blood'}).first().click();
  await atlas.locator('[data-id="root_blood"]').evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  assert.match(await atlas.locator('aside #name').innerText(),/blood/i);
  assert(await atlas.getByRole('button',{name:'Invest 1 point'}).isEnabled());
  await atlas.getByRole('button',{name:'Invest 1 point'}).click();
  assert((await page.evaluate(()=>__stage454.snapshot())).savedTalents.includes('root_blood'),'Talent purchase must update real parent state');
  await page.screenshot({path:path.join(out,'02-talents-desktop.png'),fullPage:true});
  await page.reload();await page.getByRole('button',{name:'Talents',exact:true}).click();
  await atlas.locator('#nodes .node').first().waitFor();
  assert((await page.evaluate(()=>__stage454.snapshot())).savedTalents.includes('root_blood'),'Talent must survive isolated local save reload');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(out,'03-talents-mobile.png'),fullPage:true});
  const bounds=await page.locator('iframe[title="Talent tree"]').boundingBox();assert(bounds&&bounds.width<=391&&bounds.x>=-1,'Mobile tree iframe must fit viewport');
  await page.getByRole('button',{name:'Camp',exact:true}).click();await page.locator('.phase3Camp').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Camp must not overflow 390px viewport');
  await page.screenshot({path:path.join(out,'04-camp-mobile.png'),fullPage:true});
  await page.locator('[data-phase1-expedition]:visible').first().click();
  const cards=page.locator('[data-realm-card]');assert.equal(await cards.count(),3);
  const titles=await cards.allInnerTexts();assert(titles.every(x=>x.includes('Known boss omen:')));
  await page.screenshot({path:path.join(out,'05-realm-cards-mobile.png'),fullPage:true});
  await cards.nth(1).click(); // Dangerous
  const first=await page.evaluate(()=>__stage454.snapshot());assert.equal(first.realm,first.cards[1].id);assert.equal(first.steps,13);
  assert(await page.locator('[data-dungeon-room="1"]').isVisible());
  await page.screenshot({path:path.join(out,'06-map-mobile.png'),fullPage:true});
  await page.locator('[data-dungeon-room="1"]').click();
  const dialog=page.locator('dialog[open]');await dialog.waitFor();
  assert.match(await dialog.innerText(),/steps?\s*·|steps?\s+left/);
  await dialog.getByRole('button',{name:'Enter room',exact:true}).click();
  await page.locator('.arenaEnemy').first().waitFor();
  const combat=await page.evaluate(()=>__stage454.snapshot());assert(combat.steps<13&&combat.runStatus==='fight');
  await page.screenshot({path:path.join(out,'07-combat-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:path.join(out,'08-combat-desktop.png'),fullPage:true});
  const clear=await page.evaluate(()=>__stage454.finishCombat());assert.equal(clear.status,'cleared');
  await page.locator('#phase5ExitRealm').waitFor();await page.locator('#phase5ExitRealm').click();
  const cleared=await page.evaluate(()=>__stage454.snapshot());assert.equal(cleared.stage,'choice');assert.equal(cleared.current,1);
  const steps=cleared.steps;
  await page.reload();await page.locator('[data-dungeon-room="1"]').waitFor();
  const resumed=await page.evaluate(()=>__stage454.snapshot());assert.equal(resumed.steps,steps,'Checkpoint must preserve travel cost');assert.equal(resumed.current,1);
  await page.screenshot({path:path.join(out,'09-map-restored-desktop.png'),fullPage:true});
  assert.deepEqual(errors,[],'Uncaught JavaScript errors must be absent on all screens');
  console.log('PASS Stage 4.5.4 browser: Camp (desktop/mobile), v15 Talent iframe and real purchase/reload, 3 Realm Cards, map cost/room inspection, arena (mobile/desktop), combat result and checkpoint reload. Nodes='+count);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',scenarios:9,atlasNodes:count,viewportWidths:[390,1440],errors,notes:'Combat accelerated by the test-only QA hook; screenshot layout is assessed separately; no cloud access.'},null,2));
 }catch(error){fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'failed',error:String(error),findings},null,2));throw error;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(err=>{console.error(err);process.exitCode=1});
