'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../scripts/v013-stage61-arcane-infusion.cjs');
const base={weapon:'Sword',seconds:30,attack:40,speed:1.3,spellPower:60,maxMana:100,manaRegen:3};
test('Stage 6.1 prototype is deterministic and never changes native combat source',()=>{
 const a=P.simulate(base,'baseline');assert.deepEqual(a,P.simulate({...base},'baseline'));
 const b=P.simulate(base,'infusion');assert.deepEqual(b,P.simulate({...base},'infusion'));
 assert.equal(b.arcaneCasts,0);assert.equal(a.infusions,0);
 assert(fs.readFileSync('scripts/v013-stage61-arcane-infusion.cjs','utf8').includes('NEVER wired into gameplay'));
});
test('Infusion consumes 6 Mana on activation and grants exactly two main-hit charges per activation',()=>{
 const x=P.simulate({...base,seconds:4,maxMana:6,manaRegen:0},'infusion');
 assert.equal(x.infusions,1);assert.equal(x.manaSpent,6);
 assert.equal(x.empoweredMainHits,2);assert.equal(x.infusionDamage,2*Math.round(base.spellPower*.30));
 assert.equal(x.arcaneCasts,0);
});
test('Off-Hand Dagger never consumes extra charges or triggers duplicate buffs',()=>{
 const without=P.simulate(base,'infusion'),withDagger=P.simulate({...base,offhandDagger:true,offhandStrikesPerSecond:12},'infusion');
 assert.deepEqual(withDagger,without);
});
test('Expiring infusion charges never carry over or stack',()=>{
 const slow=P.simulate({...base,seconds:14,speed:.08,maxMana:150,manaRegen:10},'infusion');
 assert(slow.expiredCharges>=1);assert(slow.empoweredMainHits<=slow.infusions*2);
});
test('Magic Sword keeps physical main attacks while current Arcane casts disappear only in candidate',()=>{
 const old=P.simulate(base,'baseline'),candidate=P.simulate(base,'infusion');
 assert(old.arcaneCasts>0);assert(old.arcaneDamage>0);assert(candidate.infusionDamage>0);
 assert.equal(old.attacks,candidate.attacks);
});
test('Wand and Staff keep Mana-paid weapon attacks; Infusion competes for Mana and is not a free bonus',()=>{
 for(const weapon of ['Wand','Staff']){
  const old=P.simulate({...base,weapon,maxMana:25,manaRegen:1},'baseline');
  const candidate=P.simulate({...base,weapon,maxMana:25,manaRegen:1},'infusion');
  assert(old.weaponCasts>0&&candidate.weaponCasts>0);
  assert(candidate.infusions>0);assert(candidate.manaSpent>0);
  assert(candidate.weaponCasts<=old.weaponCasts,'candidate must not create free casts');
 }
});
test('Native derived Magic profiles produce 15 real gear-stat contexts',()=>{
 const rows=P.nativeCases();assert.equal(rows.length,15);
 assert(rows.every(r=>r.scenario.spellPower>0&&r.scenario.maxMana>=30));
 assert(rows.some(r=>r.scenario.weapon==='Sword'&&r.scenario.rarity==='Rare'));
});
