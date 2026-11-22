'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../scripts/simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const defaults={...S.DEFAULTS,mode:'encounter',levels:[1000],seeds:[9101],builds:['blood-fury'],points:24};
test('CLI accepts a bounded deterministic v0.13 scenario matrix and rejects unknown flags',()=>{
 const o=S.parseArgs(['--mode=both','--levels=1,5,1000','--seeds=4,4,5','--builds=blood-fury,magic-decay','--points=24','--gear=previous','--runes=true','--out=reports/one.json']);
 assert.deepEqual(o.levels,[1,5,1000]);assert.deepEqual(o.seeds,[4,5]);assert.equal(o.mode,'both');assert.equal(o.gear,'previous');assert.equal(o.runes,true);
 for(const args of [['--mode=garbage'],['--levels=0'],['--seeds=NaN'],['--points=200'],['--builds=unknown'],['--out='],['--nope=1']])assert.throws(()=>S.parseArgs(args));
});
test('build profiles buy valid modern permanent Talent Tree nodes without fake ability IDs',()=>{
 for(const b of S.BUILDS){const p=S.talentPlan(b,24);assert.equal(p.treeVersion,15);assert(T.valid(p),b.id);assert(p.nodes.length>=20,b.id+' allocated only '+p.nodes.length+' nodes');for(const id of b.skills)assert(p.nodes.includes(id),b.id+' '+id);}
});
test('native equipment tiers plateau at Exalted while E1000 enemies retain their actual level',()=>{
 assert.equal(S.gearLevel(1000,'current'),1000);assert.equal(S.gearLevel(1000,'previous'),35);
 const a=S.encounter(250,S.BUILDS[0],9101,'normal',defaults),b=S.encounter(1000,S.BUILDS[0],9101,'normal',defaults);
 assert.equal(a.tier,250);assert.equal(b.tier,1000);assert.equal(b.gearTier,'Exalted');assert.equal(b.gearE,1000);
 assert.equal(a.pointsSpent,b.pointsSpent);assert(!a.timedOut&&!b.timedOut,'real high-E combat must resolve');assert(['cleared','died'].includes(a.status));assert(['cleared','died'].includes(b.status));
});
test('real boss and normal encounter scenarios are reproducible with the same seeds',()=>{
 const x=S.encounter(15,S.BUILDS[2],9102,'boss',defaults),y=S.encounter(15,S.BUILDS[2],9102,'boss',defaults);
 assert.deepEqual(x,y);assert.equal(x.kind,'boss');assert.equal(x.tier,15);assert(x.manaSpent>=0);
});
test('native dungeon routes record real survival and do not reset HP across encounters',()=>{
 const result=S.dungeon(100,S.BUILDS[0],9101,defaults);
 assert.equal(result.mode,'dungeon');assert.equal(result.error,null);assert.equal(result.timedOut,false);
 assert(result.rooms.length>0);assert(result.stage==='failed'||result.bossReached,'native route must end by death or reach the boss');
 for(let i=1;i<result.rooms.length;i++)assert(result.rooms[i].hpStart<=result.rooms[i-1].hpEnd+20,'HP was unexpectedly reset');
 assert.equal(result.rooms[0].tier,100);
 assert.equal(result.contractOutcome,result.stage==='failed'?'defeat':result.stage==='finished'?'victory':'unfinished');
 assert.equal(result.contractProgress,null,'default short-path diagnostic does not select a Contract');
});
test('Native short-path diagnostic reports genuine Contract progress and payouts',()=>{
 const opts={...defaults,mode:'dungeon',contracts:'first',boons:'first',points:0};
 const r=S.dungeon(5,S.BUILDS[0],9101,opts);
 assert.equal(r.error,null);
 assert(r.contractId);
 assert.equal(typeof r.contractProgress.current,'number');
 assert.equal(r.contractResult.id,r.contractId);
 assert.equal(r.contractReward?.id||null,r.contractResult.status==='completed'?r.contractId:null);
 if(r.contractReward)assert.equal(r.contractOutcome,'victory');
});
test('a genuine death is recorded as a death, not as a 4500-tick timeout',()=>{
 const result=S.dungeon(1000,S.BUILDS[0],9101,defaults);
 assert.equal(result.stage,'failed');assert.equal(result.won,false);assert.equal(result.timedOut,false);assert.equal(result.rooms.at(-1).status,'died');
 assert(result.rooms.at(-1).ticks<defaults.tickLimit);assert(result.rooms.length>0,'failed run must record its actual final combat');
});
test('summary counts deaths, wins and timeouts independently',()=>{
 const opts={...defaults,mode:'dungeon',builds:['blood-fury','aegis-vitality'],levels:[1000]};const r=S.simulate(opts);
 if(r.summary.errors)console.error('C5_DUNGEON_SIM_ERRORS='+JSON.stringify(r.rows.filter(x=>x.error)));
 assert.equal(r.summary.cases,2);assert.equal(r.summary.deaths,r.rows.filter(x=>x.stage==='failed').length);assert.equal(r.summary.wins,r.rows.filter(x=>x.won).length);assert.equal(r.summary.errors,0);assert.equal(r.summary.timeouts,0);
 assert.equal(r.summary.wins+r.summary.deaths,2,'every completed dungeon must record a win or a genuine defeat');
 assert.equal(r.assumptions.pointsAvailable,24);assert.match(r.assumptions.limits,/cross-Expedition build investments/);
});
