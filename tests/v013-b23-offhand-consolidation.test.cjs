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

test('B2.3C: Surrender is a resolved defeat, not a death or a timeout; paired denominators retain it',()=>{
 const {metrics,delta}=require('../scripts/v013-b23-offhand-confirmation.cjs');
 const win={won:true,died:false,timedOut:false,seconds:10},dead={won:false,died:true,timedOut:false,seconds:20},giveup={won:false,died:false,surrendered:true,timedOut:false,seconds:605},timeout={won:false,died:false,timedOut:true,seconds:1430};
 const m=metrics([win,dead,giveup,timeout]);assert.equal(m.n,4);assert.equal(m.resolved,3);assert.equal(m.wins,1);assert.equal(m.losses,2);assert.equal(m.deaths,1);assert.equal(m.surrenders,1);assert.equal(m.timeouts,1);assert.equal(m.winPct,33.333);
 const d=delta([{arms:{old:win,approved:giveup}},{arms:{old:giveup,approved:win}},{arms:{old:dead,approved:timeout}}],'old','approved');assert.equal(d.n,2);assert.equal(d.delta,0);assert.equal(d.gains,1);assert.equal(d.losses,1);
});
test('B2.3C: H23 pair-score uses owned status and rejects two-handed secondary gear without forcing a choice',()=>{
 const d=item('offhand','Off-Hand Dagger',{atk:5}),w=item('weapon','Mace',{atk:20}),stats={attack:70,spellPower:40,mana:70,manaRegen:3,agi:5,int:5,spdFlat:0};
 const h={families:['blood','decay'],armor:'Leather',weapons:['Mace'],offhands:['Daggers'],adaptiveNodes:[],synergyContext:{stats}};const h23={...h,offhandPolicy:'b23'},e={weapon:w};
 const gain=p=>N.adaptiveGearGain(d,p,'offhand',e);assert(gain(h23)>gain(h));assert(gain({...h23,adaptiveNodes:['bleeding_edge']})>gain(h23));assert(gain({...h23,adaptiveNodes:['corrupting_touch']})>gain(h23));
 assert.equal(N.adaptiveGearGain(d,h23,'offhand',{weapon:item('weapon','Staff')}),-Infinity);
});

test('B3 Final: main-hand Double Attack works with either offhand; offhand itself cannot proc it',()=>{
 const {execFileSync}=require('node:child_process');
 const old=execFileSync('git',['show','ee95b4f59c3b46b9f9158f108f0d52815f22eb4f:combat/v012-combat-runtime.js'],{encoding:'utf8'});
 const hit=(source,off,roll,secondary=false)=>{
  const {a,r}=fight('Daggers',null,source);
  r.stats.off=off; r.stats.main={...r.stats.main,effect:null};a.rng(roll);
  const hp=r.enemy.hp;
  a.gear.weaponAttack(r,secondary);
  return {damage:hp-r.enemy.hp,base:r.lastBaseHit,offhand:r.metrics.secondaryEquipmentStatusOffhandStrikes||0};
 };
 for(const off of [dagger,item('offhand','Daggers')]){
  const before=hit(old,off,.249),after=hit(null,off,.249);
  assert.equal(after.damage-before.damage,Math.max(1,Math.round(after.base*.55)));
  assert.equal(hit(null,off,.25).damage,hit(old,off,.25).damage);
  assert.deepEqual(hit(null,off,.249,true),hit(old,off,.249,true));
 }
 const shield=item('offhand','Shield');
 assert.deepEqual(hit(null,shield,.249),hit(old,shield,.249));
});
test('B3 Final: Sword physical Parry has a strict 12% threshold, not a spell dodge',()=>{
 function strike(roll,type,weapon,off){
  const {a,r}=fight(weapon);r.stats.off=off;r.hp=r.maxhp=1000;r.barrier=0;r.stats.defense=0;r.stats.blockChance=0;r.stats.attacksPerSec=.1;r.enemy.atk=100;r.enemy.attackType=type;r.enemy.attackEvery=1;r.tEnemy=1;r.enemy.groupClock=1;r.enemy.effect=null;a.rng(roll);a.tick();
  return {parries:r.metrics.parries||0,hp:r.hp};
 }
 for(const off of [dagger,item('offhand','Shield')]){
  const yes=strike(.119,'physical','Sword',off),no=strike(.12,'physical','Sword',off);
  assert.equal(yes.parries,1);assert.equal(yes.hp,1000);assert.equal(no.parries,0);assert(no.hp<1000);
  assert.equal(strike(.119,'spell','Sword',off).parries,0);
  assert.equal(strike(.119,'physical','Mace',off).parries,0);
 }
});
