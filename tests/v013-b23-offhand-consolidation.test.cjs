'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs'),{buy}=require('./v013-current-talent-helper.cjs'),N=require('../scripts/v013-natural-progression.cjs'),A=require('../scripts/v013-agent-strategy.cjs');
require('../combat/v012-gear-stats.js');
const G=globalThis.WandererV012GearStats;
const item=(slot,subtype,stats={})=>({id:slot,slot,subtype,tier:5,rarity:'Common',...stats});
const dagger=item('offhand','Off-Hand Dagger');
function fight(w,skill=null,source=null){
 const a=create(28023,undefined,source?{'combat/v012-combat-runtime.js':source}:{},{skipPersistence:true,now:1720000000000});
 a.setup(5,w,'Common');if(skill)a.state().automaticTalents=buy([skill]);a.setUnlocked(5);a.start(5,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.encounter({count:1});r.stats.attack=100;r.stats.spellPower=50;r.stats.crit=0;r.stats.critDamage=0;r.stats.bonus={};
 r.stats.evasionRating=0;r.stats.evasionBonus=0;r.enemy.hp=r.enemy.maxhp=1e7;r.enemy.def=r.enemy.baseDef=r.enemy.barrier=0;
 r.enemy.attackEvery=1e6;r.tEnemy=0;r.tPlayer=0;r.tDot=0;r.wisdomUsed=true;a.rng(.999);
 return {a,r};
}
test('native independent clock: same rate, half damage, no recursion, no two-hand strikes, reset on encounter',()=>{
 const rows=[];
 for(const w of ['Sword','Mace','Daggers']){
  const {a,r}=fight(w);r.stats.off=dagger;const interval={Sword:1.6,Mace:2.2,Daggers:1.15}[w];
  Object.assign(r.stats,{agi:5,int:5,spdFlat:0,rawAttackSpeed:1/interval,attacksPerSec:1/interval});
  for(let i=0;i<400;i++)a.tick();
  const n=r.metrics.secondaryEquipmentStatusOffhandStrikes||0,m=r.metrics.secondaryEquipmentStatusMainStrikes||0;
  assert.equal(n,19,w);assert.equal(r.metrics.secondaryEquipmentStatusOffhandRawDamage,n*40);
  rows.push({w,n,m});const next=a.encounter({count:1});assert.equal(next.offhandClock.tPlayer,0);assert.equal(next.offhandDue,false);
 }
 assert.equal(G.offhandDaggerRate({main:item('weapon','Staff'),off:dagger,attacksPerSec:1}),0);
 console.log('B23_CLOCK='+JSON.stringify(rows));
});
test('native offhand status applies Bleed and persistent paid Rot using shared cooldowns, no free Mana',()=>{
 for(const [skill,kind] of [['bleeding_edge','bleed'],['corrupting_touch','rot']]){
  const {a,r}=fight('Mace',skill);r.stats.off=dagger;r.mp=r.maxmp=100;a.rng(0);
  const mana=r.mp;
  a.gear.weaponAttack(r,true);
  const stacks=()=>kind==='bleed'?r.enemy.dots.bleed:r.enemy.v012Rot;
  assert.equal(stacks().length,1,skill);assert.equal(r.metrics[kind==='bleed'?'secondaryEquipmentStatusOffhandBleedApplications':'secondaryEquipmentStatusOffhandRotApplications'],1);
  if(kind==='rot'){assert.equal(r.mp,mana-4);assert(stacks()[0].primaryPaid);}
  a.gear.weaponAttack(r);assert.equal(stacks().length,1,'main shares offhand cooldown');
  a.gear.weaponAttack(r,true);assert.equal(stacks().length,1,'offhand shares cooldown');
  if(kind==='rot'){r.combatSeconds+=2;r.mp=0;a.gear.weaponAttack(r,true);assert.equal(stacks().length,1);assert.equal(r.mp,0);}
 }
});
test('native Block clamp cannot create Barrier at synthetic zero damage; ordinary 100 damage unchanged',()=>{
 const native=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 for(const zero of [true,false]){
  const source=zero?native.replace('  let damageBlocked=0;','  raw=0;\\n  let damageBlocked=0;'.replace('\\n','\n')):null;
  const {a,r}=fight('Mace',null,source);r.hp=r.maxhp=100;r.barrier=10;r.stats.defense=0;r.stats.blockChance=65;r.stats.blockReduction=.67;r.stats.attacksPerSec=.1;r.stats.off=item('offhand','Shield');r.enemy.atk=100;r.enemy.attackEvery=1;r.tEnemy=1;r.enemy.groupClock=1;r.enemy.effect=null;a.rng(0);
  a.tick();assert.equal(r.barrier,zero?10:0);assert.equal(r.hp,zero?100:77);assert.equal(r.metrics.shield||0,zero?0:67);
 }
});
test('agent values owned DoT, not mere affinity goals, checks Mana and two-handed legality',()=>{
 const weapon=item('weapon','Mace'),stats={attack:70,spellPower:40,mana:70,manaRegen:3,agi:5,int:5,spdFlat:0},p={offhandPolicy:'b23',families:['blood','decay'],synergyContext:{stats},adaptiveNodes:[]};
 const base=N.offhandPairUtility(weapon,dagger,p);assert(base>0);
 const bleed={...p,adaptiveNodes:['bleeding_edge']},rot={...p,adaptiveNodes:['corrupting_touch']};
 assert(N.offhandPairUtility(weapon,dagger,bleed)>base);assert(N.offhandPairUtility(weapon,dagger,rot)>base);
 assert.equal(N.offhandPairUtility(weapon,dagger,{...rot,synergyContext:{stats:{...stats,mana:0}}}),base);
 assert.equal(N.offhandPairUtility(item('weapon','Staff'),dagger,p),0);
 assert.equal(N.offhandPairUtility(weapon,dagger,{...p,offhandPolicy:null}),0);
 const cap=A.classify({equipment:{weapon,offhand:dagger},talents:buy(['corrupting_touch']),stats});assert.equal(cap.offhandDagger.rot,true);assert(cap.offhandDagger.rate>0);assert.equal(cap.offhandDagger.bleed,false);
 assert.equal(A.classify({equipment:{weapon:item('weapon','Staff'),offhand:dagger},talents:buy(['corrupting_touch']),stats}).offhandDagger.active,false);
});
test('current modules exactly mirror Pages',()=>{for(const f of ['combat/v012-buildcraft.js','combat/v012-gear-stats.js','combat/v012-combat-runtime.js','online/v012-expedition-runtime.js'])assert.equal(fs.readFileSync(f,'utf8'),fs.readFileSync('docs/'+f,'utf8'));});

test('B2.3A: Camp probe records actual native talent validity, never a hard-coded PASS',()=>{
 const {nativeCampProbe}=require('../scripts/v013-b23-offhand-confirmation.cjs');
 const progress={nodes:['fixture']},stats={attack:5};
 for(const legal of [true,false]){
  const a={state:()=>({automaticTalents:progress}),talents:{valid:p=>{assert.equal(p,progress);return legal;}},baseStats:()=>stats};
  const probe=nativeCampProbe(a);assert.equal(probe.legal,legal);assert.deepEqual(probe.stats,stats);assert.notEqual(probe.stats,stats);
 }
 const a=create(28023,undefined,{}, {skipPersistence:true,now:1720000000000});
 assert.equal(nativeCampProbe(a).legal,true);
});
