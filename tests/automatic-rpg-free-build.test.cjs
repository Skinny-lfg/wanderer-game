'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
test('free build completes an Expedition and reloads without affinity or passive choices',()=>{
 const storage=new Map();let a=create(67,undefined,{}, {sessionStorage:storage});a.start(1,true);assert.equal(a.controller().state.freeBuild,true);assert(a.controller().state.initialFamily);assert.equal(a.draft(),null);
 const map=JSON.stringify(a.controller().state.routeMap);a=create(67,undefined,{}, {sessionStorage:storage});assert.equal(a.debug().saveBlocked,false);assert.equal(JSON.stringify(a.controller().state.routeMap),map);
 for(let i=0;i<400&&!['finished','failed'].includes(a.controller().state.stage);i++){
  assert.equal(a.draft(),null);
  if(a.results().review||a.state().run?.status==='cleared'||a.results().eventExitPending)a.exitResult();
  else if(a.events.run()?.event)assert.equal(a.events.choose(2),true);
  else if(a.state().run?.status==='fight'){a.state().run.enemy.hp=0;a.win();a.flush();}
  else if(a.controller().state.stage==='choice'){
   while(a.bag.items().length>=a.bag.capacity()||a.bag.overflow()){const item=a.bag.items().at(-1);assert(item&&a.bag.discard(item.id));}
   const p=a.controller().state.offers.find(p=>a.controller().reachable(p));a.select(p.id);assert.equal(a.enter(),true);
  }else throw Error('unexpected state');
 }
 assert.equal(a.controller().state.stage,'finished');assert.equal(a.controller().state.history.length,15);assert.equal(a.state().pendingRuneReward.options.length,3);
});
test('attribute points are separate from talent points and affect gear stats',()=>{
 const a=create(21);
 const before=a.baseStats();a.state().automaticTalents={xp:100,nodes:['might'],attributes:{str:1}};const after=a.baseStats();assert.equal(after.str,before.str+1);assert(after.attack>before.attack);
});

test('free-build combat checkpoint restores without requesting an affinity',()=>{
 const storage=new Map();let a=create(70,undefined,{}, {sessionStorage:storage});a.start(1,true);const offer=a.controller().state.offers.find(p=>a.controller().reachable(p));a.select(offer.id);assert.equal(a.enter(),true);assert(a.state().run);
 a=create(70,undefined,{}, {sessionStorage:storage});assert.equal(a.debug().saveBlocked,false);assert.equal(a.draft(),null);assert.equal(a.checkpoint.resume(),true);assert(a.state().run);assert.equal(a.build().element,'fire');
});
test('new route graphs restrict choices and persist the exact connections',()=>{
 const a=create(77),c=a.controller();a.start(1,true);const g=c.state;assert(g.routeEdges);assert.equal(g.routeEdges.length,14);
 for(let i=0;i<14;i++)for(let lane=0;lane<3;lane++)assert(g.routeEdges[i][lane].length>0,'every node can progress');
 assert(g.routeEdges.slice(0,13).some(row=>row.some(links=>links.length===1)));
 const before=JSON.stringify([g.routeEdges,g.routePositions]);c.restore(JSON.parse(JSON.stringify(g)));assert.equal(JSON.stringify([g.routeEdges,g.routePositions]),before);
 const first=g.offers[0];c.select(first.id);c.enter();g.selected.waves=1;c.waveWon();c.claimReward();const expected=g.routeEdges[0][first.lane];for(const offer of g.offers)assert.equal(c.reachable(offer),expected.includes(offer.lane));
});
test('route graph rejects invalid connections and keeps a valid path to the boss',()=>{
 const a=create(93),c=a.controller();a.start(1,true);const saved=JSON.parse(JSON.stringify(c.state));
 for(let lane=0;lane<3;lane++){let reachable=new Set([lane]);for(const row of saved.routeEdges){const next=new Set();for(const source of reachable)for(const target of row[source])next.add(target);assert(next.size>0);reachable=next;}assert(reachable.has(0));}
 const broken=JSON.parse(JSON.stringify(saved));broken.routeEdges[0][0]=[];assert.throws(()=>c.restore(broken),/route connections/);
});
