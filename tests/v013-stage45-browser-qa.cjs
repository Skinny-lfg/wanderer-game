'use strict';
// Stage 4.5.4 isolated current-browser smoke. Test hooks are added to a temporary
// preview copy and never to production or persistent player data.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const reportDir=path.resolve('reports/v013-browser-qa');
fs.mkdirSync(reportDir,{recursive:true});
const report={checks:[],pageErrors:[],screenshots:[],accessibility:[],limitations:[]};
const pass=name=>{report.checks.push(name);console.log('PASS: '+name);};
const save=()=>fs.writeFileSync(path.join(reportDir,'stage45-native.json'),JSON.stringify(report,null,2));
function preview(){
 const msg=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
 const root=msg.replace(/^Isolated automatic RPG preview:\s*/,'');
 const file=path.join(root,'index.html'),html=fs.readFileSync(file,'utf8');
 const anchor='phase1Init();\nconst phase3RestoredScroll';assert(html.includes(anchor));
 const hook=[
  'globalThis.__qa45={',
  'snapshot(){const g=phase1Controller.state,d=g.dungeon,c=d?.realm?phase1Controller.realmMap():null,v=phase3Vitals();return {stage:g.stage,steps:d?.steps,realm:d?.realm,risk:c?.risk,cardCount:d?.cards?.length,relic:c?.reliquaryRoom,disabled:d?.disabledBossModifierId||null,prepared:d?.foundationState?.bossPreparation||null,hp:v.hp,event:phase6Run?.event?.id||null,status:state.run?.status||null};},',
  'path(to){const c=phase1Controller.realmMap(),d=phase1Controller.state.dungeon,q=[[d.current]],seen=new Set([d.current]);for(const p of q){if(p.at(-1)===to)return p;for(const n of WandererV013MapIntelligence.neighbors(c,d,p.at(-1)))if(!seen.has(n)){seen.add(n);q.push([...p,n]);}}return null;},',
  "finish(){for(let i=0;i<80&&state.run?.status==='fight';i++){for(const e of state.run.enemies?.length?state.run.enemies:[state.run.enemy])if(e)e.hp=0;phase1WaveWon();}if(state.run?.status==='fight')throw Error('Fight not cleared');phase5ExitResult();}",
  '};'
 ].join('\n');
 fs.writeFileSync(file,html.replace(anchor,hook+'\n'+anchor));return root;
}
async function serve(root){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!p.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(p,(e,data)=>{if(e)return res.writeHead(404).end();
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(p)]||'application/octet-stream'));res.end(data);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server;
}
async function shot(page,name){await page.screenshot({path:path.join(reportDir,name+'.png')});report.screenshots.push(name+'.png');}
async function visit(page,id){
 await page.locator('[data-dungeon-room="'+id+'"]').click();
 const dialog=page.locator('dialog[open]');await dialog.waitFor();
 assert.match(await dialog.innerText(),/steps?/i);
 await dialog.getByRole('button',{name:/Enter room|Travel here/}).click();
 const info=await page.evaluate(()=>__qa45.snapshot());
 if(info.event){
  await page.locator('.phase6Event').waitFor();
  if(info.event==='forgotten_reliquary'){
   assert.match(await page.locator('.phase6Event').innerText(),/15% max HP/i);
   await shot(page,'reliquary-desktop');
   await page.locator('[data-event-select="0"]').click();
   assert(await page.locator('#eventConfirm').isEnabled());
   await page.locator('#eventConfirm').click();
  }else await page.getByRole('button',{name:'Pass without rewards'}).click();
 }else if(info.status==='fight'){
  await page.locator('.arenaEnemy').first().waitFor();
  await page.evaluate(()=>__qa45.finish());
 }
 await page.locator('[data-dungeon-room]').first().waitFor();
 assert.equal((await page.evaluate(()=>__qa45.snapshot())).stage,'choice');
}
(async()=>{
 const root=preview(),server=await serve(root);let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||chromium.executablePath()});
  const url='http://127.0.0.1:'+server.address().port;
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.pageErrors.push({view:'desktop',error:e.message}));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('[data-phase1-expedition]:visible').first().waitFor({timeout:15000});
  await shot(page,'camp-desktop');pass('Desktop camp loads');
  await page.getByRole('button',{name:'Talents',exact:true}).click();
  await page.locator('iframe[title="Talent tree"]').waitFor({state:'visible'});
  await shot(page,'talents-desktop');pass('Current v15 Talent Tree opens');
  await page.getByRole('button',{name:'Camp',exact:true}).click();
  await page.locator('[data-phase1-expedition]:visible').first().click();
  assert.equal(await page.locator('[data-realm-card]').count(),3);
  assert((await page.locator('[data-realm-card]').allTextContents()).every(s=>s.includes('Known boss omen:')));
  await shot(page,'cards-desktop');pass('Three Realm Cards and known boss omens');
  await page.locator('[data-realm-card]').nth(1).click();
  assert.equal((await page.evaluate(()=>__qa45.snapshot())).risk,1);
  assert(await page.locator('.mapExitCount').count()>0);
  await shot(page,'map-desktop');pass('Dangerous map has visible exit counts');
  const route=await page.evaluate(()=>__qa45.path(__qa45.snapshot().relic));
  assert(route&&route.length>1,'Reliquary must be reachable by normal passages');
  for(const room of route.slice(1))await visit(page,room);
  const after=await page.evaluate(()=>__qa45.snapshot());
  assert(after.prepared?.reliquary&&after.disabled,'Reliquary must disable a modifier');
  pass('Naturally generated Reliquary reached and resolved via browser');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-dungeon-room]').first().waitFor({timeout:15000});
  const restored=await page.evaluate(()=>__qa45.snapshot());
  assert.equal(restored.disabled,after.disabled);assert.equal(restored.hp,after.hp);assert.equal(restored.steps,after.steps);
  await shot(page,'prepared-reloaded-desktop');pass('Checkpoint reload preserves HP, steps and disabled modifier');
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  mobile.on('pageerror',e=>report.pageErrors.push({view:'mobile',error:e.message}));
  await mobile.goto(url,{waitUntil:'domcontentloaded'});
  await mobile.locator('[data-phase1-expedition]:visible').first().waitFor({timeout:15000});
  await shot(mobile,'camp-mobile');
  const overflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  report.mobileOverflow=overflow;assert(overflow<=2,'Mobile camp horizontal overflow '+overflow+' px');
  await mobile.locator('[data-phase1-expedition]:visible').first().click();
  await mobile.locator('[data-realm-card]').nth(2).click();
  await shot(mobile,'map-mobile');
  const mapOverflow=await mobile.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert(mapOverflow<=2,'Mobile map document overflow '+mapOverflow+' px');
  pass('390px mobile camp and map fit viewport');
  try{
   await mobile.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const out=await mobile.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
   report.accessibility=out.violations.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.length}));
  }catch(e){report.limitations.push('Axe audit failed: '+e.message);}
  assert.deepEqual(report.pageErrors,[]);
  pass('No uncaught JS errors in observed desktop/mobile flows');
 }finally{save();if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{report.failure=String(e.stack||e);save();console.error(e);process.exitCode=1;});
