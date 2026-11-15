'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert'),{execFileSync}=require('child_process'),{chromium}=require('playwright');
const fixture=`
window.clearRoomTest=()=>{for(const enemy of state.run.enemies)enemy.hp=0;phase1WaveWon();phase5ExitResult();};window.finishDungeonTest=()=>{
  const c=phase1Controller.realmMap(),g=phase1Controller.state;
  if(g.dungeon.current!==0||g.history.length!==1)throw Error('Travel/reload mismatch');
  if(g.dungeon.steps!==c.stepLimit-2)throw Error('Return trip not charged or not saved');
  g.dungeon.steps=0;
  if(phase1Controller.visitRoom(1)||g.dungeon.current!==0)throw Error('Travel exceeded budget');
  // Exercise every room and event independently of the expedition budget.
  g.dungeon.steps=100;
  let deferred=false;
  for(let i=1;i<c.nodes.length;i++){
   if(g.dungeon.cleared.includes(i))continue;
   if(!phase1Controller.visitRoom(i))throw Error('Path missing at '+i);
   phase1Enter();
   if(c.nodes[i].event){
    if(!deferred){
     document.getElementById('eventDecline').click();
     if(g.stage!=='choice'||g.dungeon.cleared.includes(i))throw Error('Event consumed');
     phase1Controller.visitRoom(i);phase1Enter();deferred=true;
    }
    phase6EventChoice(2);
   }else{
    while(state.run?.status==='fight'){
     for(const enemy of state.run.enemies||[state.run.enemy])enemy.hp=0;
     phase1WaveWon();if(saveBlocked)throw Error(document.body.innerText);
    }
    if(!c.nodes[i].kind.includes('boss'))phase5ExitResult();
   }
   if(saveBlocked)throw Error(document.body.innerText);
   if(phase3BagOverflow()||phase3BagItems().length>=PHASE3_BAG_CAPACITY)phase3DiscardLoot(phase3BagItems()[0].id);
  }
  return {unlocked:g.unlocked,outcome:phase5Results.summary.outcome,deferred};
};
`;
(async()=>{
 const root=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim().replace('Isolated automatic RPG preview: ','');
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');if(path.extname(file)==='.html')data=data.toString().replace("(()=>{'use strict';","(()=>{'use strict';"+fixture);res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let b;
 try{
 b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port);
 await p.locator('#v013OpenForge').click();assert(await p.locator('.v013Forge').isVisible());assert(await p.locator('#v013Craft').isDisabled());
 await p.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.endsWith('_local')),data=JSON.parse(localStorage.getItem(key));data.profile.fragments=200;data.profile.crafting.essence=100;localStorage.setItem(key,JSON.stringify(data));});await p.reload();await p.getByRole('button',{name:'Camp',exact:true}).click();await p.locator('#v013OpenForge').click();
 await p.locator('#v013Recipe').selectOption('green_sword');await p.locator('#v013Craft').click();assert(await p.getByText('Item Forged',{exact:true}).isVisible());await p.evaluate(()=>document.querySelector('dialog[open]').close());
 const crafted=await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('_local')))).profile.stash.find(i=>i.recipeId==='green_sword'));assert(crafted&&crafted.rarity==='Uncommon');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('_local')))).profile.crafting.essence),96);
 await p.locator('#v013RecipeSlot').selectOption('armor');await p.locator('#v013Recipe').selectOption('green_armor_cloth');assert(await p.locator('#v013CraftFocus').isVisible());await p.locator('#v013CraftFocus').selectOption('spellweave');const previewStats=await p.locator('.v013ForgeStats').innerText();assert.match(previewStats,/Spell/);await p.locator('#v013Craft').click();assert(await p.getByText('Item Forged',{exact:true}).isVisible());await p.evaluate(()=>document.querySelector('dialog[open]').close());const infused=await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('_local')))).profile.stash.find(i=>i.recipeId==='green_armor_cloth'));assert.equal(infused.v013CraftFocus,'spellweave');assert(infused.spell>0);assert.equal(infused.armorType,'Cloth');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('_local')))).profile.crafting.essence),90);
 await p.locator('#v013RecipeRarity').selectOption('Epic');await p.locator('#v013RecipeSlot').selectOption('weapon');await p.locator('#v013Recipe').selectOption('epic_sanguine_edge');await p.locator('#v013TrackRecipe').click();assert(await p.locator('#v013Craft').isDisabled());
 await p.reload();await p.getByRole('button',{name:'Camp',exact:true}).click();assert.match(await p.locator('.v013Project').innerText(),/Sanguine Edge/);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('_local')))).profile.crafting.targetRecipe),'epic_sanguine_edge');
 await p.locator('[data-phase1-expedition]:visible').first().click();assert.equal(await p.locator('[data-contract]').count(),0);const cards=p.locator('[data-realm-card]');assert.equal(await cards.count(),3);
 await cards.first().click();await p.locator('[data-dungeon-room="2"]').click();
 await p.getByRole('button',{name:'Enter room',exact:true}).click();await p.locator('.arenaEnemy').first().waitFor();
 const count=await p.locator('.arenaEnemy').count();assert(count>=2&&count<=4);
 await p.locator('.arenaEnemy').last().click();assert.equal(await p.locator('.arenaEnemy').last().getAttribute('aria-pressed'),'true');
 fs.mkdirSync('reports/arena-review',{recursive:true});await p.locator('#scene').screenshot({path:'reports/arena-review/desktop.png'});await p.setViewportSize({width:390,height:844});await p.waitForTimeout(250);assert(await p.locator('.arenaEnemy').evaluateAll(ns=>ns.every(n=>{const r=n.getBoundingClientRect(),s=n.closest('.scene').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1;})));await p.locator('#scene').screenshot({path:'reports/arena-review/mobile.png'});await p.evaluate(()=>window.clearRoomTest());
 await p.locator('[data-dungeon-room="0"]').click();await p.getByRole('button',{name:'Travel here'}).click();
 await p.reload();await p.locator('[data-dungeon-room="0"]').waitFor({timeout:5000});
 const result=await p.evaluate(()=>window.finishDungeonTest());
 assert.deepEqual(result,{unlocked:2,outcome:'victory',deferred:true});assert.deepEqual(errors,[]);
 console.log('PASS: fresh boot, deterministic craft, tracking/save/reload, realm choice, arena focus, mobile bounds, travel, reload, deferred event and boss unlock.');
 }finally{if(b)await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
