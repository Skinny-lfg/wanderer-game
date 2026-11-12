'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {run}=require('../scripts/v012-affinity-combat-sim.cjs');
test('permanent-talent builds run deterministically at early, mid and Endless levels',()=>{
 const nodes=['might','vitality','haste','guard','flow','precision','passive_renewal','passive_blood_drinker','passive_double_strike'];
 for(const E of [1,50,200])for(const weapon of ['Sword','Staff','Daggers']){
  const seed=7202600+E,args={E,weapon,rarity:'Epic',family:'blood',strategy:'triple',runes:true,seed,controlSeed:seed,talentNodes:E===1?[]:nodes};
  const a=run(args),b=run(args);assert.equal(a.error,null);assert.equal(a.timeout,false);assert(a.reached>=1&&a.reached<=15);
  assert.deepEqual([a.reached,a.win,a.damage,a.weaponAttacks],[b.reached,b.win,b.damage,b.weaponAttacks]);
 }
});
