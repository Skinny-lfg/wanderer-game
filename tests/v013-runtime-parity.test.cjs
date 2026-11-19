'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const create=require('./v012-economy-harness.cjs');
const sim=require('../scripts/simulate-progression.cjs');

test('fingerprint changes with executed override bytes and evaluation order',()=>{
 let entries;
 const recordModules=value=>{entries=value;};
 create(7,undefined,{}, {skipPersistence:true,recordModules});
 const before=sim.sourceFingerprint(entries);
 assert(before.files.includes('tests/v012-economy-harness.cjs'));
 const file=entries[0].file;
 create(7,undefined,{[file]:fs.readFileSync(file,'utf8')+'\n// fixture override'}, {skipPersistence:true,recordModules});
 assert.equal(entries[0].overridden,true);
 assert.notEqual(sim.sourceFingerprint(entries).sha256,before.sha256);
 assert.notEqual(sim.sourceFingerprint([...entries].reverse()).sha256,sim.sourceFingerprint(entries).sha256);
});

// Identical controlled player setup for the two drivers. The browser loads real
// classic scripts in HTML order; neither driver starts account or cloud services.
function enterFixture(a){
 a.setup(4,'Wand','Rare');
 a.state().runes=[a.makeRune('wisdom',4)];a.state().runeSlots=[a.state().runes[0].id,null,null];
 a.start(1,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);
 const room=card.edges.filter(([x])=>x===0).map(([,y])=>y).find(n=>card.nodes[n].kind==='combat');
 if(!c.visitRoom(room)||!a.enter())throw Error('Cannot enter native room');
 const run=a.encounter({count:12});a.selectCombatTarget(run,run.enemies[3]);
}

test('browser encounter and CLI fight agree before, during and after native updates',async()=>{
 const seed=501,now=1720000000501;
 let entry;
 const a=create(seed,undefined,{}, {skipPersistence:true,now,captureEntry:source=>{entry=source;}});
 enterFixture(a);
 const c=a.controller(),initial=sim.combatSnapshot(a,c),targetSlots=[],expected=[];
 const select=a.selectCombatTarget,tick=a.tick;
 a.selectCombatTarget=(r,target)=>{targetSlots.push(r.enemies.indexOf(target));return select(r,target);};
 a.tick=()=>{tick();expected.push(sim.combatSnapshot(a,c));};
 const row=sim.fight(a,c,1500,'adds');
 assert(!row.timedOut);assert(row.targetSwitches>0);assert(expected.some(s=>s.run?.groupReserve?.length<initial.run.groupReserve.length));
 const {chromium}=require('playwright');
 const browser=await chromium.launch(process.env.WANDERER_BROWSER?{executablePath:process.env.WANDERER_BROWSER}:{});
 try{
  const page=await browser.newPage();
  const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const before=html.slice(0,html.indexOf('<script>'));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='localhost')return route.abort();
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:before+'<script src="/entry.js"></script></body></html>'});
   if(url.pathname==='/entry.js')return route.fulfill({contentType:'text/javascript',body:entry});
   if(!/^\/(combat|online|economy)\/[\w-]+\.js$/.test(url.pathname))return route.abort();
   return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,url.pathname.slice(1)),'utf8')});
  });
  await page.addInitScript(({seed,now})=>{
   let value=seed;Math.random=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
   Date.now=()=>now;window.setTimeout=window.setInterval=()=>0;
  },{seed,now});
  await page.goto('http://localhost/?expeditionPhase1=1');
  await page.evaluate(enterFixture.toString().replace('function enterFixture','(function')+')(window.audit)');
  const snapshots=await page.evaluate(({read,slots})=>{
   const a=window.audit,c=a.controller(),snapshot=Function('return ('+read+')')();
   const result=[snapshot(a,c)];
   for(const slot of slots){
    const r=a.state().run;
    a.selectCombatTarget(r,r.enemies[slot]);
    a.tick();result.push(snapshot(a,c));
   }
   return result;
  },{read:sim.combatSnapshot.toString(),slots:targetSlots});
  for(const [i,value] of [initial,...expected].entries())assert.deepEqual(snapshots[i],value,'native state at update '+i);
  assert.equal(row.updateCalls,expected.length);
  assert.equal(row.seconds,+((expected.at(-1).run?.combatSeconds||a.state().run?.combatSeconds||0)-(initial.run.combatSeconds||0)).toFixed(6));
 }finally{await browser.close();}
});
