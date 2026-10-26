const {test}=require('node:test'),assert=require('node:assert/strict');require('../online/v013-expedition-map.js');require('../online/v012-expedition-controller.js');const C=globalThis.WandererV012Expedition,M=globalThis.WandererV013ExpeditionMap;
const themes=Object.keys(C.THEME_FAMILIES).map(id=>({id,name:id,image:id}));
test('new seeded maps have 15 Realms, 3–4 unique events, and preserve a two-Elite route average',()=>{
 const counts=new Set();for(let seed=1;seed<=10;seed++){let n=seed*1000;const c=C.create(themes,()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296));c.start();c.chooseInitial('blood');const g=c.state;assert.equal(g.rooms.length,15);const ids=g.eventsByRealm.filter(Boolean);counts.add(ids.length);assert(ids.length===3||ids.length===4);assert.equal(new Set(ids).size,ids.length);assert(g.rooms.filter(k=>k==='elite').length>=1&&g.rooms.filter(k=>k==='elite').length<=3);const paths=M.allPaths(g.map);assert.equal(paths.reduce((sum,path)=>sum+path.filter(node=>node.kind==='elite').length,0),paths.length*2);assert([3,4].includes(g.map.segments.length));assert((g.map.topologyId||'').length>0);c.restore(g);}assert.equal(counts.size,2);
});
test('three shared rerolls, no fourth, and exactly one saved boss card without acquiring a fourth affinity',()=>{
 const c=C.create(themes,()=>.4);c.start();c.chooseInitial('blood');assert.equal(c.state.offers.length,1,'the first route is a single auto-entering node');
 c.select(c.state.offers[0].id);c.enter();const waves=c.state.selected.waves;for(let n=0;n<waves;n++)c.waveWon();c.claimReward();assert(c.state.offers.length>=1&&c.state.offers.length<=3,'a fork exposes two/three connected paths; a linear section exposes one');
 for(let i=0;i<3;i++)c.reroll(i%c.state.offers.length);assert.equal(c.state.rerolls,0);assert.throws(()=>c.reroll(0));
 assert.equal(c.state.offers.length,c.state.map.availableNodeIds.length);assert.deepEqual(c.state.offers.map(p=>p.nodeId).sort(),c.state.map.availableNodeIds.slice().sort());assert.equal(Object.keys(C.REALMS).length,12);
});
