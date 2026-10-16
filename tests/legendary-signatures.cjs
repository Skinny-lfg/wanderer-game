// v0.9.3 Legendary signatures: deterministic mechanics and production-loot smoke.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {DEFINITIONS,attack,defense}=require('../combat/legendary.js');
const harness=require('./combat-harness.cjs');
const html=fs.readFileSync('index.html','utf8');
const match=html.match(/const LEGENDARY_CATALOG=(\[[^\n]+\]);/);
assert.ok(match,'legendary catalogue must remain readable');
const catalog=JSON.parse(match[1]);
const ids=new Set(catalog.map(entry=>entry.id));
const affinities=new Set(['poison','bleed','sunder','crit','shield','regen','burn','slow','drain','nature','shock','tide','crystal']);
assert.equal(catalog.length,21);
assert.equal(ids.size,21);
assert.deepEqual(new Set(Object.keys(DEFINITIONS)),ids);
assert.ok(html.includes('<script src="combat/legendary.js"></script>'));
const names=new Set();
for(const entry of catalog){
 const ability=DEFINITIONS[entry.id];
 assert.ok(ability&&affinities.has(ability.affinity),entry.id+' fixed affinity');
 assert.ok(ability.name&&ability.description&&ability.cooldown>=7&&ability.cooldown<=15,entry.id+' bounded ability');
 assert.ok(!names.has(ability.name),entry.id+' unique ability name');
 names.add(ability.name);
}
const base={enemyHpRatio:.2,enemyArmorRatio:.5,enemyBarrier:100,hpRatio:.25,
 barrierRatio:0,poison:6,bleed:6,burn:6,cast:true,critical:true,
 attackCount:12,castCount:3,blocked:50,hit:150,maxhp:500};
for(const entry of catalog){
 let fired=false;
 for(const enemyHpRatio of [.2,.95])for(const barrierRatio of [0,.05])
 for(const attackCount of [1,3,4,12]){
  const c={...base,enemyHpRatio,barrierRatio,attackCount};
  if(attack(entry.id,c)||defense(entry.id,c))fired=true;
 }
 assert.ok(fired,entry.id+' must have a reachable trigger');
}
assert.deepEqual(attack('fang-of-the-sunbreaker',{...base,poison:2}),null);
assert.deepEqual(attack('fang-of-the-sunbreaker',{...base,poison:3}),{damage:.22});
assert.deepEqual(defense('the-eternal-oath',{...base,blocked:0}),null);
assert.deepEqual(defense('the-eternal-oath',{...base,blocked:50}),{retaliate:.18});

const h=harness(),a=h.combatAccess,state=a.getState(),seen=new Set();
for(const entry of catalog){
 const slot=entry.slot==='ring'?'ring1':entry.slot;
 for(let i=0;i<65;i++){
  const item=a.makeItem(40,slot,null,'loot',entry.subtype,'Legendary');
  const def=DEFINITIONS[item.legendaryId];
  assert.ok(def,item.name+' registered signature');
  assert.equal(item.effect,def.affinity,item.name+' fixed affinity');
  assert.equal(item.name,catalog.find(x=>x.id===item.legendaryId).name,'identity/name compatibility');
  if(['Staff','Wand','Orb','Tome','Charm'].includes(item.subtype))
   assert.equal(item.magic,def.affinity,'magic affinity must match fixed identity');
  assert.equal(a.legendarySignature(item).identity.id,item.legendaryId);
  seen.add(item.legendaryId);
 }
}
assert.deepEqual(seen,ids,'all 21 identities obtainable via original legal slots/subtypes');

const sword=a.makeItem(40,'weapon',null,'loot','Sword','Legendary');
assert.equal(sword.legendaryId,'blade-of-the-first-dawn');
state.equip=a.makeSlots();state.equip.weapon=sword;
const stats=a.totalStats();
const r={stats,maxhp:stats.maxhp,hp:stats.maxhp,barrier:0,combatSeconds:2,
 enemy:{hp:900,maxhp:1000,barrier:0,def:50,baseDef:50,
 poisonStacks:0,bleedStacks:0,burnStacks:0,dots:{poison:[],bleed:[],burn:[]}}};
assert.equal(a.legendaryAttackBonus(r,100,false,false),18,'First Light bonus');
assert.equal(a.legendaryAttackBonus(r,100,false,false),0,'cooldown shared across repeated hits');
r.combatSeconds+=11;
assert.equal(a.legendaryAttackBonus(r,100,false,false),18,'re-enabled after 10 combat seconds');

let aegis=null;
for(let i=0;i<50;i++){
 const item=a.makeItem(40,'offhand',null,'loot','Shield','Legendary');
 if(item.legendaryId==='aegis-of-the-dawnstar'){aegis=item;break;}
}
assert.ok(aegis,'Aegis should be obtainable');
state.equip=a.makeSlots();state.equip.offhand=aegis;
r.stats=a.totalStats();r.barrier=0;r.combatSeconds=40;
a.legendaryDefensiveEffects(r,50,0);
assert.ok(r.barrier>0,'Aegis block generates Barrier');
const firstBarrier=r.barrier;
a.legendaryDefensiveEffects(r,50,0);
assert.equal(r.barrier,firstBarrier,'no repeated defensive trigger inside cooldown');
state.equip.weapon=a.makeItem(40,'weapon',null,'loot','Bow','Legendary');
r.stats=a.totalStats();r.barrier=0;r.combatSeconds+=20;
a.legendaryDefensiveEffects(r,50,0);
assert.equal(r.barrier,0,'two-handed bow does not activate reserved Off-Hand');

const mismatch={...sword,subtype:'Wand'};
assert.equal(a.legendarySignature(mismatch),null,'legacy subtype mismatch never gains wrong signature');
console.log('Legendary signatures: 21 identities, fixed new-drop affinities, cooldowns, 2H reservation, legacy safety PASS');
