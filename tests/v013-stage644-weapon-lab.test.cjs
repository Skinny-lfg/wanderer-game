'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {patch}=require('../scripts/v013-stage644-e10-lab.cjs');
// This mutates only the ephemeral CI checkout, NOT the branch or the browser game.
patch('bow1+status50+rupture+bloomFixed');
const runtime=fs.readFileSync(path.join(root,'combat/v012-combat-runtime.js'),'utf8');
const build=fs.readFileSync(path.join(root,'combat/v012-buildcraft.js'),'utf8');
function extract(s,name){
 const i=s.indexOf('function '+name+'(');assert(i>=0,'Missing native function '+name);
 const j=s.indexOf('{',i);let depth=0;
 for(let k=j;k<s.length;k++){if(s[k]==='{')depth++;else if(s[k]==='}'&&--depth===0)return s.slice(i,k+1);}
 throw Error('Unclosed function '+name);
}
function harness(active=4,subtype='Bow',random=()=>0){
 const metrics={},logs=[],enemies=Array.from({length:active},(_,i)=>({
  name:'Enemy '+i,hp:2000,maxhp:2000,barrier:0,baseDef:20,def:20,dots:{bleed:[],burn:[]},v012Rot:[],bleedStacks:0
 }));
 const reserve=[{name:'Unspawned',hp:1000,maxhp:1000,dots:{bleed:[]},v012Rot:[]}];
 const r={enemy:enemies[0],enemies,groupReserve:reserve,mp:20,combatSeconds:1,
  stats:{attack:100,spellPower:30,main:{subtype,effect:'bleed'}}};
 const ports={state:{automaticTalents:{nodes:['affinity_blood','affinity_decay','affinity_fury']}},phase1Build:{runtime:{talentBonuses:{}}},
  isPhase1Run:()=>true,setNow:x=>x.combatSeconds,gameRandom:random,affinityProcChance:()=>.6,
  applyAffinity:(effect,e)=>{e.weaponEffect=(e.weaponEffect||0)+1;},
  phase6Metric:(r,k,v)=>(metrics[k]=(metrics[k]||0)+v),
  synchronizeDots:e=>{e.bleedStacks=e.dots.bleed.length;},
  floatText(){},combatLinkEffect(){},addLog:s=>logs.push(s)};
 const ctx={ports,root:{},WandererV012Buildcraft:{enemyDefense:()=>0,bleedDamage:(_,n)=>n}};
 vm.createContext(ctx);
 vm.runInContext(['v013SecondaryHit','v013Stage644SecondaryStatus','groupSecondaryDamage']
  .map(n=>extract(runtime,n)).join('\n'),ctx);
 return {ctx,r,ports,metrics,logs,enemies,reserve};
}
test('Bow candidate has exactly one additional target with Piercing even in a four-slot arena',()=>{
 assert(runtime.includes("includes('bow_pierce')?[.60]:[.40]"));
 const h=harness();
 assert.equal(h.ctx.groupSecondaryDamage(h.r,100,[.60],'🏹 Piercing Arrow',true),1);
 assert(h.enemies[1].hp<2000);
 assert.equal(h.enemies[2].hp,2000);assert.equal(h.enemies[3].hp,2000);
 assert.equal(h.reserve[0].hp,1000);
});
test('All physical AoE families share the same secondary status bridge, without hitting reserves',()=>{
 for(const [weapon,factors] of [['Bow',[.60]],['Two-Handed',[.60,.60]],['Daggers',[.22,.22]],['Sword',[.25]],['Mace',[.30]]]){
  const h=harness(4,weapon);
  assert.equal(h.ctx.groupSecondaryDamage(h.r,100,factors,'weapon',true),factors.length);
  for(const e of h.enemies.slice(1,1+factors.length)){
   assert(e.bleedStacks>0,'No secondary Bleed '+weapon);
   assert(e.v012Rot.length>0,'No secondary Rot '+weapon);
   assert(e.def<e.baseDef,'No secondary Sunder '+weapon);
  }
  assert.equal(h.r.mp,20-factors.length,'Secondary Rot does not pay Mana '+weapon);
  assert.equal(h.reserve[0].hp,1000,'Reserve was hit '+weapon);
  assert.equal(h.reserve[0].dots.bleed.length,0,'Reserve was marked '+weapon);
 }
});
test('Secondary statuses obey chance reduction and cannot recursively activate primary onAttack',()=>{
 const h=harness(4,'Two-Handed',()=>.99);
 assert.equal(h.ctx.groupSecondaryDamage(h.r,100,[.6,.6],'⚔ Cleave',true),2);
 assert.equal(h.enemies[1].bleedStacks,0);
 assert.equal(h.enemies[1].v012Rot.length,0);
 assert.equal(h.r.mp,20);
});
test('Grave Bloom funded cast seeds and bursts only inside four active slots',()=>{
 const h=harness(4,'Staff',()=>1),ctx=h.ctx;
 ctx.prepared=id=>id==='grave_bloom';ctx.triggered=()=>{};
 vm.runInContext(extract(runtime,'v013GraveBloomPulse'),ctx);
 const damage=ctx.v013GraveBloomPulse(h.r,h.enemies[0],100);
 assert.equal(damage,0);
 assert.equal(h.enemies[0].v012Rot.length,1);
 assert.equal(h.enemies[1].v012Rot.length,1);
 assert.equal(h.enemies[2].v012Rot.length,1);
 assert.equal(h.enemies[3].v012Rot.length,0);
 assert(h.enemies[1].hp<2000&&h.enemies[2].hp<2000);
 assert.equal(h.reserve[0].v012Rot.length,0);
 assert(build.includes('c.secondaryHit?.(m,Math.max(1,Math.round(source.damage*'));
});
test('Carrion candidate accumulates real weapon base damage and detonates after threshold',()=>{
 const ctx={rank:(b,id)=>id==='carrion_detonation'?1:0,specialized:()=>false,
  activated:()=>true,ready:()=>true};
 vm.createContext(ctx);vm.runInContext(extract(build,'onAttack'),ctx);
 const e={hp:300,maxhp:300,bleedStacks:1,v012Rot:[{damage:2,remaining:3}],dots:{bleed:[{damage:2,remaining:3}]}},
  bursts=[],b={runtime:{},cooldowns:{}};
 for(let i=0;i<3;i++)ctx.onAttack(b,{enemy:e,base:50,critical:false,now:i+1,
  player:{stats:{attack:100},hp:100,maxhp:100,mp:10},areaDamage:x=>bursts.push(x),trigger:()=>{}});
 assert.equal(bursts.length,0);
 ctx.onAttack(b,{enemy:e,base:50,critical:false,now:4,
  player:{stats:{attack:100},hp:100,maxhp:100,mp:10},areaDamage:x=>bursts.push(x),trigger:()=>{}});
 assert.equal(bursts.length,1);
 assert.equal(e.v013RuptureCharge,0);
});
