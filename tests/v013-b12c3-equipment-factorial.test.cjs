'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs'),F=require('../scripts/v013-b12c3-equipment-factorial.cjs');
const item=(subtype,slot='weapon',atk=1)=>({id:slot+'-'+subtype,slot,subtype,atk,tier:5,rarity:'Uncommon'});
test('factorial compatibility and strict identity are orthogonal; no full bundle',()=>{
 const equip={weapon:item('Two-Handed')},off=item('Orb','offhand');
 for(const arm of ['A','B','C','D']){
  const p=F.profile('smart-blood-two-handed',arm),flags=F.ARMS[arm];
  assert.equal(p.strictResearchIdentity,flags.strict);
  assert.equal(p.agentDecisionQuality,null);
  assert.equal(N.investmentAllowed(off,p,'offhand',equip),!flags.compat);
  assert.equal(N.identityMatch(item('Sword'),p,'weapon'),flags.strict?false:null);
  assert.equal(N.identityMatch(item('Two-Handed'),p,'weapon'),flags.strict?true:null);
 }
});
test('pure cells preserve base offhand intent; E adds only explicit Dual Daggers',()=>{
 const d=F.profile('smart-fury-daggers','D'),e=F.profile('smart-fury-daggers','E');
 assert.deepEqual({...e,offhands:d.offhands},d);
 assert.deepEqual(e.offhands,['Daggers']);
 assert.equal(N.gearDecisionTargets(item('Daggers'),e).length,1,'extra B1.2C.2 target enumeration is held off');
});
test('compatibility-only blocks unusable Forge options without enforcing identity',()=>{
 const p=F.profile('smart-blood-two-handed','B');
 const equip={weapon:item('Two-Handed')};
 const recipes=[{id:'orb',slot:'offhand',rarity:'Uncommon'},{id:'sword',slot:'weapon',rarity:'Uncommon'}];
 const previews={orb:item('Orb','offhand',1000),sword:item('Sword','weapon',1000)};
 const a={state:()=>({equip,crafting:{cores:{}}}),economyCanAct:()=>true,forge:{recipes,progress:()=>({ready:true,cost:{fragments:1,essence:1,reagents:{}}}),preview:id=>previews[id]}};
 assert.deepEqual(N.gearInvestmentCandidates(a,p,5).map(x=>x.recipe.id),['sword']);
});
test('factorial contrasts use paired additive scale',()=>{
 assert.deepEqual(F.contrast({A:3,B:5,C:2,D:6}),{compat:3,identity:0,interaction:2});
});
