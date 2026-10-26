const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};vm.runInNewContext(fs.readFileSync('online/v013-expedition-map.js','utf8')+'\n'+fs.readFileSync('online/v012-expedition-controller.js','utf8'),env);const C=env.WandererV012Expedition;
const themes=Object.keys(C.THEME_FAMILIES).map(id=>({id,name:id,image:id}));
function seeded(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
test('map-integrated controller completes all 15 Realms with unchanged calendar, mandatory rewards, and three-affinity cap',()=>{
 const c=C.create(themes,seeded(9137));c.start(1);const map=c.state.map,calendar=[...c.state.rooms];
 assert.equal(map.version,1);assert.equal(JSON.stringify(map.rows.map(row=>row[0].kind)),JSON.stringify(calendar));assert.equal(map.seed>=0,true);c.chooseInitial('blood');
 for(let realm=1;realm<=15;realm++){
  const g=c.state;assert.equal(g.stage,'choice');
  const available=g.offers;assert(available.length>=1&&available.length<=3);assert.equal(new Set(available.map(o=>o.family)).size,available.length);assert(available.every(o=>g.map.availableNodeIds.includes(o.nodeId)));
  const chosen=available[(realm*7)%available.length];c.select(chosen.id);assert.equal(g.map.currentNodeId,chosen.nodeId);assert.equal(g.map.availableNodeIds.length,0);c.enter();assert.equal(g.stage,'combat');assert(g.families.length<=3);assert(g.families.includes(chosen.family));
  const snapshot=JSON.parse(JSON.stringify(g)),restored=C.create(themes,seeded(99));restored.restore(snapshot);assert.deepEqual(JSON.parse(JSON.stringify(restored.state.map)),snapshot.map);assert.equal(restored.state.selected.nodeId,chosen.nodeId);
  const waves=Math.max(1,chosen.waves);for(let wave=1;wave<=waves;wave++){assert.equal(g.wave,wave);const result=c.waveWon();if(wave<waves)assert.equal(result.planeComplete,false);else assert.equal(result.planeComplete,true);}
  assert(g.map.completedNodeIds.includes(chosen.nodeId));assert.equal(g.history.length,realm);
  if(realm<15){assert.equal(c.state.stage,'choice');assert(c.state.rewardPending);assert.equal(c.state.offers.length,0);c.claimReward();assert(c.state.offers.some(o=>o.family===chosen.family),'the selected path affinity is represented at the next fork');}
  else{assert.equal(c.state.stage,'finished');assert.equal(c.state.unlocked,2);assert.equal(c.state.history[14].boss,true);assert.equal(c.state.history[14].nodeId,'r15n0');}
 }
 assert.equal(calendar.filter(k=>k==='elite').length,2);assert(calendar.filter(k=>k==='event').length===3||calendar.filter(k=>k==='event').length===4);assert.equal(map.completedNodeIds.length,15);
});
test('reroll preserves route node, uses one shared charge, and cannot duplicate-select or replay a completed node',()=>{
 const c=C.create(themes,seeded(123));c.start();c.chooseInitial('blood');c.select(c.state.offers[0].id);c.enter();
 const before=c.state.offers.map(o=>o.nodeId).sort(),waves=c.state.selected.waves;for(let i=0;i<waves;i++)c.waveWon();c.claimReward();
 const forkNodes=c.state.offers.map(o=>o.nodeId).sort();c.reroll(0);assert.deepEqual(c.state.offers.map(o=>o.nodeId).sort(),forkNodes);assert.equal(c.state.rerolls,2);assert.throws(()=>c.select('not-offered'),/Not an offered Realm/);assert.equal(c.state.map.availableNodeIds.length,3);assert.equal(before.length,1);
});
