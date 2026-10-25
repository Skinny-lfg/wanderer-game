const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');

function finishSelectedRealm(a){
 const g=a.controller().state,p=g.selected;p.waves=1;
 const result=a.controller().waveWon();assert.equal(result.planeComplete,true);
 a.controller().claimReward();
}
function plannedScenario(seed,combatSeed){
 const a=create(seed);a.streams(10101,20202,30303,combatSeed);a.controller().planAffinities(['blood','decay','magic']);a.start(1);a.initial('blood');
 return a;
}

test('B.1 plan creates early offer opportunities without unlocking affinities or forcing the route',()=>{
 const a=create(5101),c=a.controller();
 assert.throws(()=>c.planAffinities(['blood','blood','magic']),/three distinct/);
 c.planAffinities(['blood','decay','magic']);a.start(1);assert.deepEqual(Array.from(c.state.families),[]);a.initial('blood');
 assert.deepEqual(Array.from(c.state.families),['blood']);assert(c.state.offers.some(p=>p.family==='blood'));
 const initial=c.state.offers.find(p=>p.family==='blood');c.select(initial.id);c.enter();finishSelectedRealm(a);
 assert.equal(c.state.planeIndex,2);assert(c.state.offers.some(p=>p.family==='decay'),'second planned affinity is offered by Realm 2');
 assert(!c.state.families.includes('decay'),'an offer alone does not unlock its affinity');
 const other=c.state.offers.find(p=>p.family!=='decay');c.select(other.id);c.enter();assert(!c.state.families.includes('decay'),'another combination remains selectable');finishSelectedRealm(a);
 assert.equal(c.state.planeIndex,3);assert(c.state.offers.some(p=>p.family==='magic'),'third planned affinity is offered by Realm 3, before Realm 7');
 assert(!c.state.families.includes('magic'));assert.equal(c.state.rerolls,3,'planning does not add or consume rerolls');
 const third=c.state.offers.findIndex(p=>p.family==='magic');c.reroll(third);assert.equal(c.state.rerolls,2,'only the existing paid/limited reroll rule changes its counter');
});

test('B.1 optional plan restores old and active checkpoints without changing caps',()=>{
 const a=create(5102);a.start(1);a.initial('blood');const old=JSON.parse(JSON.stringify(a.controller().state));delete old.affinityPlan;delete old.affinityPlanSeen;
 a.controller().restore(old);assert.equal(a.controller().state.affinityPlan,null);assert.equal(a.controller().state.affinityPlanSeen.length,3);
 const b=create(5103),c=b.controller();c.planAffinities(['blood','decay','magic']);b.start(1);b.initial('blood');
 const saved=JSON.parse(JSON.stringify(c.state));c.restore(saved);assert.deepEqual(Array.from(c.state.affinityPlan),['blood','decay','magic']);
 for(const f of ['blood','decay','magic']){if(!c.state.families.includes(f))c.state.families.push(f);}
 assert.equal(c.allowed().length,3);assert.throws(()=>c.planAffinities(['blood','decay','magic']),/between Expeditions/);
});

test('B.1 deterministic harness streams replay offers and passive drafts independently of combat RNG',()=>{
 function run(combatSeed){
  const a=plannedScenario(5201,combatSeed),c=a.controller();
  const offerAtStart=JSON.stringify(c.state.offers.map(p=>[p.id,p.family,p.waves,p.elite]));
  const first=c.state.offers.find(p=>p.family==='blood');a.select(first.id);a.enter();
  for(let i=0;i<8;i++)a.tick();
  const g=c.state;g.selected.waves=1;g.selected.event=null;g.selected.eventId=null;a.state().run.enemy.hp=0;a.win();a.flush();
  return {offerAtStart,draft:JSON.stringify(a.draft().options.map(p=>[p.id,p.category,p.rank,p.requires]))};
 }
 assert.deepEqual(run(40404),run(90909),'same control streams reproduce route offers and passive choices despite independent combat seeds');
});
