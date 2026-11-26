'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs'),A=require('../scripts/v013-agent-strategy.cjs'),B=require('../scripts/v013-build-planner.cjs'),S=require('../scripts/simulate-progression.cjs'),create=require('./v012-economy-harness.cjs');
const T=globalThis.WandererAutomaticTalents;
test('Gullet policy prioritizes returning living fragments, ignores generic escorts, and agrees with controlled mechanics',()=>{
 const boss={boss:true,bossStyle:'devourer',hp:100,maxhp:100},escort={hp:1,role:'minion'},late={hp:10,stage84Minion:'radiance',fragmentReturnAt:12},early={hp:20,stage84Minion:'radiance',fragmentReturnAt:10};
 const r={status:'fight',enemy:boss,encounterLeader:boss,enemies:[boss,escort,early,late]};
 const before=JSON.stringify(r);
 assert.equal(A.selectTarget(r,A.classify({equipment:{weapon:{subtype:'Sword'}}}),boss),early);
 assert.equal(S.selectTarget(r,'mechanics'),early);assert.equal(JSON.stringify(r),before);
 early.hp=0;assert.equal(A.selectTarget(r,null,boss),late);late.hp=0;assert.equal(A.selectTarget(r,null,boss),boss);
});
test('explicit agent goals match their own live affinity and element scope',()=>{
 const map=new Map(T.NODES.map(n=>[n.id,n]));
 for(const [name,p] of Object.entries(N.PROFILES)){
  if(p.plan)continue;
  for(const id of [...(p.targets||[]),...(p.preparedTargets||[])]){
   const n=map.get(id);assert(n&&!n.pending,name+': '+id);assert(!n.family||p.families.includes(n.family),name+': '+id);
   assert(!n.pair||p.style!=='focused'&&n.pair.every(f=>p.families.includes(f)),name+': '+id);
   const plan={primary:p.families[0],secondary:p.families[1],mix:p.style!=='focused',element:p.element||'arcane'};
   assert(B.routeTo(T,T.create(),id,plan,p.families)?.length,name+': unreachable '+id);
   assert(!n.element||n.element===(p.element||'arcane'),name+': '+id);
  }
 }
});
test('native earned explicit Blood/Aegis and Decay/Arcane profiles do not leak unrelated affinities',()=>{
 for(const id of ['balanced','hexblade-hybrid','arcane-arcane']){
  const a=create(8817,undefined,{}, {skipPersistence:true}),p=N.PROFILES[id],s=a.state();
  s.automaticTalents={...a.talents.create(),xp:3000};
  const r=N.spendEarnedTalents(a,p);assert(a.talents.valid(s.automaticTalents));assert.equal(s.automaticTalents.xp,3000);assert(r.spent>0);
  for(const n of s.automaticTalents.nodes.map(id=>id.replace(/_rank\d+$/,''))){
   const node=a.talents.NODES.find(x=>x.id===n);assert(!node.family||p.families.includes(node.family),id+': '+n);
   assert(!node.pair||node.pair.every(f=>p.families.includes(f)),id+': '+n);
  }
 }
});
test('unknown milestone has infinite cost, never appears affordable',()=>{
 const p=B.getPlan('blood-pure');assert.equal(B.canOwnMilestone(T,T.create(),p,['blood'],'removed_talent_id'),Infinity);
});
