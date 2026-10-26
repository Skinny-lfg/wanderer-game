const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};vm.runInNewContext(fs.readFileSync('online/v013-expedition-map.js','utf8')+'\n'+fs.readFileSync('online/v012-expedition-controller.js','utf8'),env);const C=env.WandererV012Expedition,M=env.WandererV013ExpeditionMap;
const themes=Object.keys(C.THEME_FAMILIES).map(id=>({id,name:id,image:id}));
const EVENT_GROUPS=[['traveling_merchant','smugglers_caravan','relic_collector','cursed_artificer'],['cursed_altar','soul_mirror','whispering_idol','echo_shrine'],['cursed_chest','forgotten_arsenal','runic_vault','bounty_writ'],['restless_spring','fallen_wanderer','oracle_of_paths','last_ember']];
function seeded(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
const decisions=new Set([2,6,10,13]);
function legacyMap(seed,rooms){
 const random=M.rng(seed),rows=rooms.map((kind,i)=>Array.from({length:i===0||i===14?1:3},(_,lane)=>({id:`r${i+1}n${lane}`,realm:i+1,lane,kind}))),edges=[];
 for(let i=0;i<rows.length-1;i++)for(let lane=0;lane<rows[i].length;lane++){const next=rows[i+1],destinations=rows[i].length===1?next.map((_,j)=>j):next.length===1?[0]:[lane%next.length,(lane+1)%next.length];for(const to of new Set(destinations))edges.push({from:rows[i][lane].id,to:next[to].id});}
 return {version:1,seed,rows,nodes:rows.flat(),edges,currentNodeId:null,chosenNodeIds:[],completedNodeIds:[],availableNodeIds:[rows[0][0].id],autoAdvance:true,generationKey:Math.floor(random()*4294967296)};
}
test('controller follows four strategic forks, enforces mandatory rewards, and keeps route offers bound to nodes',()=>{
 const c=C.create(themes,seeded(9137));c.start(1);const g=c.state,map=g.map;assert.equal(map.version,2);assert.deepEqual(g.rooms,M.calendar(map));assert.equal(g.rooms.filter(k=>k==='elite').length,2);assert.equal(g.eventsByRealm.filter(Boolean).length,map.eventCount);c.chooseInitial('blood');
 const choices=[0,2,0,1],route=M.walkPath(map,choices),offerCounts=[];
 for(let realm=1;realm<=15;realm++){
  const state=c.state;assert.equal(state.stage,'choice');assert.equal(state.planeIndex,realm);const offers=state.offers;offerCounts.push(offers.length);assert.equal(offers.length,decisions.has(realm)?3:1);assert.equal(new Set(offers.map(o=>o.nodeId)).size,offers.length);assert(offers.every(o=>state.map.availableNodeIds.includes(o.nodeId)));
  const chosen=offers.find(o=>o.nodeId===route[realm-1].id);assert(chosen,'the chosen node must have one corresponding real Realm offer');assert.equal(chosen.event,route[realm-1].eventId||null);assert.equal(chosen.elite,route[realm-1].kind==='elite'||route[realm-1].kind==='boss'||chosen.elite);
  c.select(chosen.id);assert.equal(state.map.currentNodeId,chosen.nodeId);assert.equal(state.map.availableNodeIds.length,0);c.enter();assert.equal(state.stage,'combat');assert(state.families.length<=3);assert(state.families.includes(chosen.family));
  const snapshot=JSON.parse(JSON.stringify(state)),restored=C.create(themes,seeded(99));restored.restore(snapshot);assert.deepEqual(JSON.parse(JSON.stringify(restored.state.map)),snapshot.map);assert.equal(restored.state.selected.nodeId,chosen.nodeId);
  for(let i=0;i<Math.max(1,chosen.waves);i++)c.waveWon();assert(state.map.completedNodeIds.includes(chosen.nodeId));assert.equal(state.history.length,realm);
  if(realm<15){assert.equal(state.stage,'choice');assert(state.rewardPending);assert.equal(state.offers.length,0);assert.throws(()=>c.select('skip-passive'),/Realm not available/);c.claimReward();if(realm<14)assert(state.offers.some(o=>o.family===chosen.family),'selected affinity remains at next node after Realm '+realm);}
  else{assert.equal(state.stage,'finished');assert.equal(state.unlocked,2);assert.equal(state.history[14].boss,true);assert.equal(state.history[14].nodeId,'r15n0');}
 }
 assert.deepEqual(offerCounts,[1,3,1,1,1,3,1,1,1,3,1,1,3,1,1]);
 assert.equal(map.completedNodeIds.length,15);assert.equal(map.availableNodeIds.length,0);assert(M.validate(map,g.rooms,EVENT_GROUPS));
});
test('rerolls cannot change a branch destination or refill the shared budget',()=>{
 const c=C.create(themes,seeded(123));c.start();c.chooseInitial('blood');c.select(c.state.offers[0].id);c.enter();const waves=c.state.selected.waves;for(let i=0;i<waves;i++)c.waveWon();c.claimReward();const destinations=c.state.offers.map(o=>o.nodeId).sort();c.reroll(0);assert.deepEqual(c.state.offers.map(o=>o.nodeId).sort(),destinations);assert.equal(c.state.rerolls,2);assert.throws(()=>c.select('not-offered'),/Not an offered Realm/);assert.equal(c.state.map.availableNodeIds.length,3);const snapshot=JSON.parse(JSON.stringify(c.state));const restored=C.create(themes,seeded(3));restored.restore(snapshot);assert.equal(restored.state.rerolls,2);assert.deepEqual(restored.state.map.availableNodeIds,destinations);
});
test('event IDs and selected encounter kind restore from the route node, independent of the canonical schedule',()=>{
 const c=C.create(themes,seeded(345));c.start();c.chooseInitial('blood');const g=c.state;const eventOffer=g.offers[0];assert.equal(M.node(g.map,eventOffer.nodeId).kind,'combat');c.select(eventOffer.id);c.enter();const waves=g.selected.waves;for(let i=0;i<waves;i++)c.waveWon();c.claimReward();const fork=g.offers.find(o=>M.node(g.map,o.nodeId).kind==='elite');assert(fork);c.select(fork.id);c.enter();const saved=JSON.parse(JSON.stringify(g));const clone=C.create(themes,seeded(2));clone.restore(saved);assert.equal(clone.state.selected.elite,true);assert.equal(M.node(clone.state.map,clone.state.selected.nodeId).kind,'elite');
});
test('existing version-1 map checkpoints remain restorable',()=>{
 const c=C.create(themes,seeded(988)),g=c.state;c.start();c.chooseInitial('blood');g.map=legacyMap(77,g.rooms);let group=0;g.eventsByRealm=g.rooms.map(kind=>kind==='event'?EVENT_GROUPS[group++][0]:null);const root=g.offers[0];c.select(root.id);c.enter();const clone=C.create(themes,seeded(3));clone.restore(JSON.parse(JSON.stringify(g)));assert.equal(clone.state.map.version,1);assert.equal(clone.state.stage,'combat');assert.equal(clone.state.selected.nodeId,'r1n0');
});
test('all 81 route combinations finish without affinity, event, or progress softlocks',()=>{
 for(let combination=0;combination<81;combination++){
  let code=combination;const choices=Array.from({length:4},()=>{const lane=code%3;code=Math.floor(code/3);return lane;}),c=C.create(themes,seeded(30000+combination));c.start();c.chooseInitial('blood');const g=c.state,path=M.walkPath(g.map,choices);
  for(let realm=1;realm<=15;realm++){
   assert.equal(g.stage,'choice');const offers=g.offers,expected=path[realm-1];assert.equal(offers.length,decisions.has(realm)?3:1);const chosen=offers.find(offer=>offer.nodeId===expected.id);assert(chosen,'missing offer for '+expected.id+' in path combination '+combination);c.select(chosen.id);c.enter();assert(g.families.length<=3);
   const waves=Math.max(1,chosen.waves);for(let wave=0;wave<waves;wave++)c.waveWon();
   if(realm<15){assert(g.rewardPending);assert.equal(g.offers.length,0);c.claimReward();}else assert.equal(g.stage,'finished');
  }
  assert.equal(g.map.completedNodeIds.length,15);assert.equal(g.history.length,15);assert.equal(g.history[14].boss,true);
 }
});
