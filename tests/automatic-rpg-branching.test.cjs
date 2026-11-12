'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
test('branching routes survive reload and only permit connected choices',()=>{
 const a=create(91),c=a.controller();a.start(1);a.initial('blood');
 assert.equal(c.state.routeMap.length,15);assert(c.state.routeMap.some(row=>new Set(row).size>1));
 const first=c.state.offers.find(p=>p.lane===0&&p.family==='blood')||c.state.offers.find(p=>p.family==='blood');c.select(first.id);c.enter();c.state.selected.waves=1;c.waveWon();c.claimReward();
 const saved=JSON.parse(JSON.stringify(c.state)),map=JSON.stringify(saved.routeMap);c.restore(saved);assert.equal(JSON.stringify(c.state.routeMap),map);
 const previous=c.state.history[0].lane;for(const offer of c.state.offers){assert.equal(c.reachable(offer),Math.abs(previous-offer.lane)<=1);if(!c.reachable(offer))assert.throws(()=>c.select(offer.id),/reachable/);}
 const option=c.state.offers.find(p=>c.reachable(p)),kind=c.state.routeMap[1][option.lane];assert.equal(option.elite,kind==='elite');c.select(option.id);c.enter();c.restore(JSON.parse(JSON.stringify(c.state)));
});
test('legacy expeditions without a route map still restore',()=>{
 const a=create(19),c=a.controller();a.start(1);a.initial('blood');const old=JSON.parse(JSON.stringify(c.state));delete old.routeMap;for(const p of old.offers)delete p.lane;c.restore(old);assert.equal(c.state.routeMap,undefined);assert(c.state.offers.every(p=>c.reachable(p)));
});
