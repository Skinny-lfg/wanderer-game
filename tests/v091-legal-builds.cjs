const assert=require('node:assert/strict');
const {harness}=require('../scripts/simulate-v091.cjs');
const {plan,profiles,weapons,affinities}=require('../scripts/validate-v091-builds.cjs');
const c=harness();
for(const level of [10,30,50,100,200])for(const weapon of weapons)for(const profile of Object.keys(profiles)){
 const gearPlan=plan(c.inspect,level,weapon,profile,1);
 const r=c.trial({level,weapon,gearPlan,seed:77,diagnostics:true});
 assert.equal(r.counts[affinities[weapon]],profiles[profile].points);
 assert(Math.max(...Object.values(r.counts))<=profiles[profile].points,'no unintended higher set');
 for(const spec of gearPlan){const item=r.equipment[spec.slot];
  assert(c.inspect.elementPool(item.slot,item.subtype).includes(item.effect));
  for(const k of ['tier','rarity','effect','subtype'])assert.equal(item[k],spec[k]);
  if(['Staff','Wand','Orb','Tome','Charm'].includes(item.subtype))assert.equal(item.magic,item.effect);
  else assert.equal(item.magic,null);
 }
 if(c.inspect.isTwoHanded(r.equipment.weapon))assert.equal(r.equipment.offhand,null);
 assert(!r.timeout);assert(Number.isFinite(r.damageOut)&&Number.isFinite(r.seconds));
 if(weapon==='Staff'||weapon==='Wand')assert.equal(r.casts+r.fallbacks,r.attacks);
}
const args={level:30,weapon:'Staff',gearPlan:plan(c.inspect,30,'Staff','mixed-mid'),seed:91,diagnostics:true};
const project=r=>({...r,equipment:undefined}); // IDs/timestamps are intentionally not seeded.
assert.deepEqual(JSON.parse(JSON.stringify(project(c.trial(args)))),JSON.parse(JSON.stringify(project(c.trial(args)))));
assert.throws(()=>c.trial({level:10,gearPlan:[{slot:'weapon',subtype:'Staff',effect:'crit',tier:10,rarity:'Rare'}]}),/Invalid gear plan/);
console.log('PASS legal affinity pools, actual generated stats, mixed gear, 2/3/5 thresholds, handedness and deterministic trials');
