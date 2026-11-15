'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../docs');
const output = path.resolve(__dirname, '../reports/arena-hud');
const fixture = `
globalThis.arenaFixture = {
 start(kind, weapon='Staff'){
  clearInterval(clock);
  state.equip=makeSlots();
  state.equip.weapon=makeItem(3,'weapon',null,'loot',weapon,'Rare');
  if(weapon==='Sword')state.equip.offhand=makeItem(3,'offhand',null,'loot','Shield','Rare');
  let progress={...WandererAutomaticTalents.create(),xp:10000};
  for(const id of ['passive_barrier_pulse','passive_retaliation'])
   for(const node of WandererAutomaticTalents.path(progress,id)||[])
    if(!progress.nodes.includes(node))progress=WandererAutomaticTalents.allocate(progress,node);
  state.automaticTalents=progress;
  phase1Begin(1,true);
  phase1Controller.chooseRealm(phase1Controller.state.dungeon.cards[0].id);
  phase1Controller.visitRoom(1);
  phase1Enter();
  const r=state.run,theme=phase2Theme(phase1Controller.state.selected.id);
  const boss=kind==='boss',elite=kind==='elite';
  const leader=enemyFor(3,1,{theme,boss,elite,variant:BOSS_ARCHETYPES[0]});
  const group=kind==='single'?[leader]:[leader,enemyFor(3,1,{theme}),enemyFor(3,1,{theme})];
  group.forEach((e,i)=>{e.groupSlot=i;e.groupClock=0;e.hp=e.maxhp=10000;});
  r.enemy=leader;r.enemies=kind==='single'?undefined:group;r.groupReserve=[];r.totalMobCount=group.length;
  r.hp=r.maxhp=10000;r.barrier=500;r.mp=r.maxmp=10000;
  renderCombat();clearInterval(clock);
 },
 tick(){updateFight();}
};
`;
const server = http.createServer((req,res)=>{
  const file = path.join(root,new URL(req.url,'http://localhost').pathname==='/'?'index.html':new URL(req.url,'http://localhost').pathname);
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.gif':'image/gif'})[path.extname(file)]||'application/octet-stream');
    if(file.endsWith('index.html'))data=data.toString().replace('phase1Init();\nconst phase3RestoredScroll',fixture+'\nphase1Init();\nconst phase3RestoredScroll');
    res.end(data);
  });
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  fs.mkdirSync(output,{recursive:true});
  let browser;
  try{
    browser=await chromium.launch({channel:'msedge'});
    for(const kind of ['single','patrol','elite','boss']){
      const page=await browser.newPage({viewport:{width:1440,height:1000}});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:'+server.address().port);
      await page.evaluate(kind=>arenaFixture.start(kind),kind);
      await page.evaluate(()=>{for(let i=0;i<25;i++)arenaFixture.tick();});
      assert.equal(await page.locator('#arenaHud').count(),1);
      assert.equal(await page.locator('#arenaHud #heroHpFill').count(),1);
      assert.equal(await page.locator('#arenaHud #heroMpFill').count(),1);
      assert(await page.locator('.actionSlot').count()>1);
      if(kind==='elite'||kind==='boss'){
        assert.match(await page.locator('[data-group-portrait="0"]').getAttribute('data-attack-src'), /\.gif$/);
        assert.match(await page.locator('[data-group-portrait="0"]').getAttribute('data-idle-src'), /\.(png|webp)$/);
      }
      await page.locator('#combatSpeed').click();
      await page.locator('#combatSpeed').click();
      assert.match(await page.locator('#combatSpeed').innerText(), /4/);
      await page.locator('#scene').screenshot({path:path.join(output,kind+'-scene.png')});
      await page.locator('.combatLayout > .panel').first().screenshot({path:path.join(output,kind+'-desktop.png')});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.join(output,kind+'-mobile.png'),fullPage:true});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const bounds=await page.locator('.arenaEnemy').evaluateAll(nodes=>nodes.every(n=>{
        const box=n.getBoundingClientRect(),arena=n.closest('#scene').getBoundingClientRect();
        return box.left>=arena.left && box.right<=arena.right+1 && box.top>=arena.top && box.bottom<=arena.bottom+1;
      }));
      assert(bounds,'Enemy outside mobile arena');
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log('PASS: single, patrol, elite and boss HUD; live resources and action cooldowns; mobile bounds; no browser errors.');
  }finally{
    await browser?.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
