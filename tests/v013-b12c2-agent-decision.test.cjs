'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs');
const item=(subtype,slot='weapon',atk=1)=>({id:slot+'-'+subtype,slot,subtype,atk,tier:5,rarity:'Uncommon',armorType:['Cloth','Leather','Plate'].includes(subtype)?subtype:null});
const candidate=(weapons,offhands=[])=>({families:['fury'],weapons,offhands,armor:'Leather',strictResearchIdentity:true,agentDecisionQuality:'b12c2-v1'});
test('blocked off-hand investment matches native two-handed slots, including starter fallback',()=>{
 for(const weapon of ['Two-Handed','Bow','Staff']){
  for(const off of ['Shield','Orb','Tome','Charm','Off-Hand Dagger']){
   const p=candidate([weapon]),o=item(off,'offhand');
   assert.equal(N.investmentAllowed(o,p,'offhand',{weapon:item(weapon)}),false);
   assert.equal(N.investmentAllowed(o,p,'offhand',{weapon:item('Sword')}),false);
   assert.equal(N.investmentAllowed(o,candidate(['Sword']),'offhand',{weapon:item(weapon)}),false);
  }
 }
 assert.equal(N.investmentAllowed(item('Tome','offhand'),candidate(['Wand']),'offhand',{weapon:item('Wand')}),true);
 assert.equal(N.investmentAllowed(item('Orb','offhand'),candidate(['Bow','Daggers']),'offhand',{weapon:item('Daggers')}),true);
});
test('profile identity protects acquired gear and permits an actual upgrade from fallback',()=>{
 const p=candidate(['Wand'],['Tome']);
 assert(N.identityGain(item('Wand'),item('Sword','weapon',999),p,'weapon')>=10);
 assert(N.identityGain(item('Sword','weapon',999),item('Wand'),p,'weapon')<0);
 assert.equal(N.investmentAllowed(item('Cloth','armor'),p,'armor',{}),false);
 assert.equal(N.investmentAllowed(item('Leather','armor'),p,'armor',{}),true);
 assert.equal(N.investmentAllowed(item('Orb','offhand'),p,'offhand',{weapon:item('Wand')}),false);
});
test('dual daggers can evaluate both legal slots, without confusing the offhand alias',()=>{
 const p=candidate(['Daggers'],['Daggers']),e={weapon:item('Daggers')};
 assert.deepEqual(N.gearDecisionTargets(item('Daggers'),p),['weapon','offhand']);
 assert.deepEqual(N.gearDecisionTargets(item('Off-Hand Dagger','offhand'),p),['offhand']);
 assert.equal(N.investmentAllowed(item('Off-Hand Dagger','offhand'),p,'offhand',e),true);
 assert.equal(N.investmentAllowed(item('Shield','offhand'),p,'offhand',e),false);
});
test('Forge filters repeated unusable offhand projects before spending materials',()=>{
 const p=candidate(['Two-Handed']),e={weapon:item('Two-Handed')};
 const recipes=[{id:'orb',slot:'offhand',rarity:'Uncommon'},{id:'sword',slot:'weapon',rarity:'Uncommon'},{id:'upgrade',slot:'weapon',rarity:'Uncommon'}];
 const previews={orb:item('Orb','offhand',1000),sword:item('Sword','weapon',1000),upgrade:item('Two-Handed','weapon',100)};
 const a={state:()=>({equip:e,crafting:{cores:{}}}),economyCanAct:()=>true,forge:{recipes,progress:()=>({ready:true,cost:{fragments:1,essence:1,reagents:{}}}),preview:id=>previews[id]}};
 assert.deepEqual(N.gearInvestmentCandidates(a,p,5).map(x=>x.recipe.id),['upgrade']);
 const original={...p,strictResearchIdentity:false,agentDecisionQuality:null};
 assert(N.gearInvestmentCandidates(a,original,5).some(x=>x.recipe.id==='orb'),'baseline path remains available');
});
test('intentional two-hand transition retains existing identity exception',()=>{
 const p=candidate(['Two-Handed']),e={weapon:item('Sword','weapon',999),offhand:item('Shield','offhand',999)};
 assert(Number.isFinite(N.investmentGain(item('Two-Handed'),p,'weapon',e)));
 const mixed=candidate(['Sword','Two-Handed']);
 assert.equal(N.investmentGain(item('Two-Handed','weapon',2),mixed,'weapon',{weapon:item('Sword','weapon',1),offhand:item('Shield','offhand',999)}),-Infinity);
});
