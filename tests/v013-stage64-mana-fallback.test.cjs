'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
require('../combat/v012-buildcraft.js');
function combat(kind){
 const a=create(64020+kind.length,undefined,{}, {skipPersistence:true});
 a.setup(5,kind,'Rare');a.setUnlocked(5);a.start(5,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);assert(c.visitRoom(1));assert(a.enter());
 const r=a.state().run;
 assert.equal(r.stats.main?.subtype,kind);
 r.enemy.hp=r.enemy.maxhp=10000000;r.enemy.def=r.enemy.baseDef=r.enemy.barrier=0;
 r.stats.attack=100;r.stats.spellPower=100;r.stats.crit=0;r.stats.bonus={};r.wisdomUsed=true;
 a.rng(.999);return {a,r};
}
test('Wand and Staff auto-attack at low Mana: weak physical hit, no funded spell',()=>{
 for(const kind of ['Wand','Staff']){
  const {a,r}=combat(kind);
  r.mp=0;const fallback=a.gear.weaponAttack(r);
  assert.equal(fallback,55,kind+' weak autoattack is 55% of Attack before Defense');
  assert.equal(r.unfundedAttack,true);
  assert.equal(r.metrics?.unfundedCasterAttacks,1);
  assert.equal(r.metrics?.fundedCasts||0,0);
  assert.equal(r.mp,0);
  r.mp=100;const spell=a.gear.weaponAttack(r);
  assert(spell>fallback,kind+' paid spell must be stronger');
  assert.equal(r.unfundedAttack,false);
  assert.equal(r.metrics?.fundedCasts,1);
  assert.equal(r.metrics?.unfundedCasterAttacks,1);
 }
});
test('Caster with depleted Mana cannot expend existing Infusion charges for free extra Magic damage',()=>{
 for(const kind of ['Wand','Staff']){
  const {a,r}=combat(kind),b=a.build();
  b.unlockedFamilies=['magic'];b.families=['magic'];b.element='arcane';
  b.runtime.permanentBuild=true;b.runtime.specializations=['affinity_magic'];
  b.runtime.infusionCharges=2;b.runtime.infusionExpiresAt=999;b.runtime.infusionNextAt=999;
  r.mp=0;const hit=a.gear.weaponAttack(r);
  assert.equal(hit,55,kind);assert.equal(b.runtime.infusionCharges,2,kind+' preserves unpaid charge');
  assert.equal(r.metrics?.infusionDamage||0,0);
 }
});
test('Insufficient Mana for the 12-Mana Infusion does not suppress an 8-Mana elemental cast',()=>{
 require('../combat/talent-catalog.js');require('../combat/talent-graph-next.js');require('../combat/talent-graph-bridge.js');
 require('../combat/talent-graph-runtime.js');require('../combat/v012-combat-runtime.js');
 const T=globalThis.WandererAutomaticTalents,B=globalThis.WandererV012Buildcraft;
 let progress={...T.create(),xp:10000};
 for(const id of ['affinity_magic','element_choice']){
  const n=T.allocate(progress,id);assert(n,id);progress=n;
 }
 progress=T.selectElement(progress,'fire');assert(progress);
 const b=B.create();B.syncPermanent(b,progress);
 const e={hp:1000,maxhp:1000,def:0,baseDef:0,slowTime:0,dots:{burn:[]},v012Rot:[]};
 const player={hp:100,maxhp:100,mp:9,maxmp:30,enemy:e,phase1:true,status:'fight',stats:{caster:false,spellPower:100,main:{subtype:'Sword'}},phase1Plane:'test',enc:1};
 const hits=[],events=[],ctx={enemy:e,player,now:20,power:100,base:50,funded:false,random:()=>.99,
  dot:(k,p)=>events.push([k,p]),damage:(p)=>events.push(['damage',p]),chill:n=>events.push(['chill',n]),mana:()=>{},log:()=>{}};
 const ports={phase1Build:b,isPhase1Run:()=>true,phase2Context:()=>ctx,phase6Metric:()=>{},
  state:{run:player,automaticTalents:{nodes:progress.nodes,element:'fire'},equip:{}},
  combatEffect:()=>{},setDirectEnemyDamage:(_r,n)=>hits.push(n)};
 const rt=WandererV012CombatRuntime.create(ports);
 rt.phase2MagicTick(player);
 assert.equal(hits.length,1);assert.equal(player.mp,1);
 assert.equal(b.runtime.infusionCharges||0,0);
});
