const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};vm.runInNewContext(fs.readFileSync('online/v013-expedition-map.js','utf8')+'\n'+fs.readFileSync('online/v012-expedition-controller.js','utf8'),env);const C=env.WandererV012Expedition,M=env.WandererV013ExpeditionMap;
const themes=Object.keys(C.THEME_FAMILIES).map(id=>({id,name:id,image:id}));
const EVENT_GROUPS=[['traveling_merchant','smugglers_caravan','relic_collector','cursed_artificer'],['cursed_altar','soul_mirror','whispering_idol','echo_shrine'],['cursed_chest','forgotten_arsenal','runic_vault','bounty_writ'],['restless_spring','fallen_wanderer','oracle_of_paths','last_ember']];
function seeded(seed){let n=seed>>>0;return()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);}
function legacyMap(seed,rooms){
 const random=M.rng(seed),rows=rooms.map((kind,i)=>Array.from({length:i===0||i===14?1:3},(_,lane)=>({id:`r${i+1}n${lane}`,realm:i+1,lane,kind}))),edges=[];
 for(let i=0;i<rows.length-1;i++)for(let lane=0;lane<rows[i].length;lane++){const next=rows[i+1],destinations=rows[i].length===1?next.map((_,j)=>j):next.length===1?[0]:[lane%next.length,(lane+1)%next.length];for(const to of new Set(destinations))edges.push({from:rows[i][lane].id,to:next[to].id});}
 return {version:1,seed,rows,nodes:rows.flat(),edges,currentNodeId:null,chosenNodeIds:[],completedNodeIds:[],availableNodeIds:[rows[0][0].id],autoAdvance:true,generationKey:Math.floor(random()*4294967296)};
}
function version2Map(seed){
 const widths=[1,3,3,3,1,3,3,3,1,3,3,1,3,3,1],rows=widths.map((width,i)=>Array.from({length:width},(_,lane)=>({id:`r${i+1}n${lane}`,realm:i+1,lane,kind:i===14?'boss':'combat',eventId:null,eventGroup:null}))),edges=[];
 for(let realm=1;realm<15;realm++){const from=rows[realm-1],to=rows[realm];for(const source of from){const destinations=from.length===1?to:to.length===1?to:[to[source.lane]];for(const target of destinations)edges.push({from:source.id,to:target.id});}}
 const put=(realm,lane,kind,group=null,choice=0)=>Object.assign(rows[realm-1][lane],{kind,eventGroup:kind==='event'?group:null,eventId:kind==='event'?EVENT_GROUPS[group][choice]:null});
 put(2,0,'elite');put(3,1,'elite');put(4,2,'elite');put(10,0,'elite');put(11,0,'event',1,0);put(10,1,'event',1,1);put(11,1,'elite');put(10,2,'elite');put(11,2,'event',1,2);
 for(let lane=0;lane<3;lane++){put(7,lane,'event',0,lane);put(13,lane,'event',2,lane);}
 const segments=M.SEGMENTS.map(segment=>({...segment,paths:Array.from({length:3},(_,lane)=>Array.from({length:segment.end-segment.start+1},(_,offset)=>`r${segment.start+offset}n${lane}`))}));return{version:2,seed,generationKey:334455,autoAdvance:true,rows,nodes:rows.flat(),edges,segments,eventCount:3,eventGroupOrder:[0,1,2,3],currentNodeId:null,chosenNodeIds:[],completedNodeIds:[],availableNodeIds:['r1n0']};
}
test('controller follows a seeded strategic route, enforces mandatory rewards, and binds offers to available nodes',()=>{
 const c=C.create(themes,seeded(9137));c.start(1);const g=c.state,map=g.map;assert.equal(map.version,3);assert.deepEqual(g.rooms,M.calendar(map));assert(g.rooms.filter(k=>k==='elite').length>=1&&g.rooms.filter(k=>k==='elite').length<=3);assert.equal(g.eventsByRealm.filter(Boolean).length,map.eventCount);c.chooseInitial('blood');
 const route=M.walkPath(map,map.segments.map(s=>s.decision===map.riskDecision?s.width-1:0)),offerCounts=[];
 for(let realm=1;realm<=15;realm++){
  const state=c.state;assert.equal(state.stage,'choice');assert.equal(state.planeIndex,realm);const offers=state.offers;offerCounts.push(offers.length);assert.equal(offers.length,state.map.availableNodeIds.length);assert(offers.length>=1&&offers.length<=3);assert.equal(new Set(offers.map(o=>o.nodeId)).size,offers.length);assert(offers.every(o=>state.map.availableNodeIds.includes(o.nodeId)));
  const chosen=offers.find(o=>o.nodeId===route[realm-1].id);assert(chosen,'the chosen node must have one corresponding real Realm offer');assert.equal(chosen.event,route[realm-1].eventId||null);assert.equal(chosen.elite,route[realm-1].kind==='elite'||route[realm-1].kind==='boss'||chosen.elite);
  c.select(chosen.id);assert.equal(state.map.currentNodeId,chosen.nodeId);assert.equal(state.map.availableNodeIds.length,0);c.enter();assert.equal(state.stage,'combat');assert(state.families.length<=3);assert(state.families.includes(chosen.family));
  const snapshot=JSON.parse(JSON.stringify(state)),restored=C.create(themes,seeded(99));restored.restore(snapshot);assert.deepEqual(JSON.parse(JSON.stringify(restored.state.map)),snapshot.map);assert.equal(restored.state.selected.nodeId,chosen.nodeId);
  for(let i=0;i<Math.max(1,chosen.waves);i++)c.waveWon();assert(state.map.completedNodeIds.includes(chosen.nodeId));assert.equal(state.history.length,realm);
  if(realm<15){assert.equal(state.stage,'choice');assert(state.rewardPending);assert.equal(state.offers.length,0);assert.throws(()=>c.select('skip-passive'),/Realm not available/);c.claimReward();if(realm<14)assert(state.offers.some(o=>o.family===chosen.family),'selected affinity remains at next node after Realm '+realm);}
  else{assert.equal(state.stage,'finished');assert.equal(state.unlocked,2);assert.equal(state.history[14].boss,true);assert.equal(state.history[14].nodeId,'r15n0');}
 }
 assert.equal(map.completedNodeIds.length,15);assert.equal(map.availableNodeIds.length,0);assert(M.validate(map,g.rooms,EVENT_GROUPS));
});
test('rerolls cannot change a branch destination or refill the shared budget',()=>{
 const c=C.create(themes,seeded(123));c.start();c.chooseInitial('blood');c.select(c.state.offers[0].id);c.enter();const waves=c.state.selected.waves;for(let i=0;i<waves;i++)c.waveWon();c.claimReward();const destinations=c.state.offers.map(o=>o.nodeId).sort();c.reroll(0);assert.deepEqual(c.state.offers.map(o=>o.nodeId).sort(),destinations);assert.equal(c.state.rerolls,2);assert.throws(()=>c.select('not-offered'),/Not an offered Realm/);assert.equal(c.state.map.availableNodeIds.length,destinations.length);const snapshot=JSON.parse(JSON.stringify(c.state));const restored=C.create(themes,seeded(3));restored.restore(snapshot);assert.equal(restored.state.rerolls,2);assert.deepEqual(restored.state.map.availableNodeIds,destinations);
});
test('selected Event node and its exact ID survive save/reload independently of the canonical schedule',()=>{
 let c,g,eventOffer;for(let seed=0;seed<1000;seed++){c=C.create(themes,seeded(seed));c.start();g=c.state;if(g.map.rows[1].some(n=>n.kind==='event')){eventOffer=g.map.rows[1].find(n=>n.kind==='event');break;}}assert(eventOffer,'seeded routes expose an Event at R2');c.chooseInitial('blood');const root=g.offers[0];c.select(root.id);c.enter();for(let i=0;i<root.waves;i++)c.waveWon();c.claimReward();const offer=g.offers.find(o=>o.nodeId===eventOffer.id);assert(offer);assert.equal(offer.event,eventOffer.eventId);c.select(offer.id);c.enter();const saved=JSON.parse(JSON.stringify(g)),clone=C.create(themes,seeded(2));clone.restore(saved);assert.equal(clone.state.selected.event,eventOffer.eventId);assert.equal(M.node(clone.state.map,clone.state.selected.nodeId).kind,'event');
});
test('existing version-1 map checkpoints remain restorable',()=>{
 const c=C.create(themes,seeded(988)),g=c.state;c.start();c.chooseInitial('blood');g.rooms=[...g.rooms];let elites=g.rooms.flatMap((kind,index)=>kind==='elite'?[index]:[]);if(elites.length<2)for(let i=1;i<14&&elites.length<2;i++)if(g.rooms[i]==='combat'){g.rooms[i]='elite';elites.push(i);}else{}else if(elites.length>2)for(const i of elites.slice(2))g.rooms[i]='combat';g.map=legacyMap(77,g.rooms);let group=0;g.eventsByRealm=g.rooms.map(kind=>kind==='event'?EVENT_GROUPS[group++][0]:null);const root=g.offers[0];c.select(root.id);c.enter();const clone=C.create(themes,seeded(3));clone.restore(JSON.parse(JSON.stringify(g)));assert.equal(clone.state.map.version,1);assert.equal(clone.state.stage,'combat');assert.equal(clone.state.selected.nodeId,'r1n0');
});
test('previous structured version-2 maps remain restorable after deterministic topology migration',()=>{
 const c=C.create(themes,seeded(811)),g=c.state;c.start();g.map=version2Map(1234);g.rooms=M.calendar(g.map);g.eventsByRealm=M.events(g.map);assert(M.validate(g.map,g.rooms,EVENT_GROUPS));c.chooseInitial('blood');const root=g.offers[0];c.select(root.id);c.enter();const clone=C.create(themes,seeded(42));clone.restore(JSON.parse(JSON.stringify(g)));assert.equal(clone.state.map.version,2);assert.equal(clone.state.selected.nodeId,'r1n0');assert.equal(clone.state.map.availableNodeIds.length,0);
});
test('each generated topology completes without affinity, event, or progress softlocks',()=>{
 for(let seed=0;seed<90;seed+=10){
  const c=C.create(themes,seeded(30000+seed));c.start();c.chooseInitial('blood');const g=c.state,widths=g.map.segments.map(segment=>segment.width),count=widths.reduce((n,width)=>n*width,1);let code=(30000+seed)>>>0;const choices=widths.map(width=>{const lane=code%width;code=Math.floor(code/width);return lane;}),path=M.walkPath(g.map,choices);
  for(let realm=1;realm<=15;realm++){
   assert.equal(g.stage,'choice');const offers=g.offers,expected=path[realm-1];assert.equal(offers.length,g.map.availableNodeIds.length);const chosen=offers.find(offer=>offer.nodeId===expected.id);assert(chosen,'missing offer for '+expected.id+' in path seed '+seed);c.select(chosen.id);c.enter();assert(g.families.length<=3);
   const waves=Math.max(1,chosen.waves);for(let wave=0;wave<waves;wave++)c.waveWon();
   if(realm<15){assert(g.rewardPending);assert.equal(g.offers.length,0);c.claimReward();}else assert.equal(g.stage,'finished');
  }
  assert.equal(g.map.completedNodeIds.length,15);assert.equal(g.history.length,15);assert.equal(g.history[14].boss,true);
 }
});
