'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs'),A=require('../scripts/v013-b12c4-adaptive-commitment.cjs');
const item=(subtype,slot='weapon',atk=1,extra={})=>({id:slot+'-'+subtype,slot,subtype,atk,tier:5,rarity:'Uncommon',...extra});
const p=(nodes=[],weapons=['Daggers'])=>({families:['fury'],weapons,armor:'Leather',offhands:[],agentCompatibilityOnly:true,adaptiveEquipment:'b12c4-v1',preferDualDaggers:true,adaptiveNodes:nodes});
const earned=n=>['affinity_fury',...Array.from({length:n-1},(_,i)=>'node_'+i)];
test('commitment has bounded steps and depends on earned affinity not desired goals',()=>{
 for(const [count,w] of [[1,0],[5,0],[6,5],[10,5],[11,10],[20,10],[21,15],[50,15]])assert.equal(N.commitmentWeight(p(earned(count))),w);
 assert.equal(N.commitmentWeight(p(Array(30).fill('other'))),0);
});
test('soft identity permits a strong temporary alternative even after commitment',()=>{
 const profile=p(earned(21)),gear={weapon:item('Daggers','weapon',1)};
 assert(N.adaptiveGearGain(item('Sword','weapon',100),profile,'weapon',gear)>0);
 assert(N.adaptiveGearGain(item('Sword','weapon',1),profile,'weapon',gear)<0);
});
test('hand comparison charges full displaced offhand and rejects blocked offhand',()=>{
 const profile=p(earned(10),['Sword','Two-Handed']),gear={weapon:item('Sword','weapon',10),offhand:item('Shield','offhand',0,{def:100})};
 assert(N.adaptiveGearGain(item('Two-Handed','weapon',11),profile,'weapon',gear)<0);
 assert(N.adaptiveGearGain(item('Two-Handed','weapon',1000),profile,'weapon',gear)>0);
 assert.equal(N.adaptiveGearGain(item('Orb','offhand'),profile,'offhand',{weapon:item('Staff')}),-Infinity);
});
test('soft dual dagger preference needs main dagger and actual fury commitment, never excludes Orb',()=>{
 const dagger=item('Off-Hand Dagger','offhand',3),orb=item('Orb','offhand',1),profile=p(earned(21));
 assert.equal(N.commitmentBonus(dagger,profile,'offhand',item('Sword')),0);
 assert(N.commitmentBonus(dagger,profile,'offhand',item('Daggers'))>0);
 assert.equal(N.commitmentBonus(dagger,p([]),'offhand',item('Daggers')),0);
 assert.equal(N.investmentAllowed(orb,profile,'offhand',{weapon:item('Daggers')}),true);
 assert.deepEqual(N.adaptiveTargets(dagger,profile),['offhand']);
});
test('candidate keeps compatibility, no strict identity or old combined policy',()=>{
 for(const id of ['smart-fury-daggers','smart-blood-two-handed','arcane-frost']){
  const profile=A.profile(id);assert.equal(profile.agentCompatibilityOnly,true);assert.equal(profile.strictResearchIdentity,false);assert.equal(profile.agentDecisionQuality,null);
 }
 assert.equal(N.investmentAllowed(item('Orb','offhand'),A.profile('smart-blood-two-handed'),'offhand',{weapon:item('Sword')}),false);
});
