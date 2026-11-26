'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs'),F=require('../scripts/v013-b12c5-decision-isolation.cjs'),B=require('../scripts/v013-b12c3-equipment-factorial.cjs');
const item=(subtype,slot,stats={})=>({id:slot+'-'+subtype,subtype,slot,tier:1,rarity:'Common',...stats});
test('pure cells enable only requested factors and preserve compatibility',()=>{
 for(const [arm,identity,hands] of [['G',true,false],['H',false,true],['I',true,true],['J',false,false]]){
  const p=F.profile('smart-arcane-arcane-pure',arm);
  assert.equal(N.softIdentityEnabled(p),identity);assert.equal(N.handPairEnabled(p),hands);
  assert.equal(p.agentCompatibilityOnly,true);assert.equal(p.strictResearchIdentity,false);assert.equal(p.agentDecisionQuality,null);
  assert.equal(N.investmentAllowed(item('Orb','offhand'),p,'offhand',{weapon:item('Staff','weapon')}),false);
 }
});
test('identity-only is exactly B at zero commitment on all native slots',()=>{
 const b=B.profile('smart-arcane-arcane-pure','B'),p={...F.profile('smart-arcane-arcane-pure','G'),adaptiveNodes:['root_arcane','affinity_arcane','basic_path_arcane_0_1']};
 const gear={weapon:item('Sword','weapon',{atk:3}),offhand:item('Shield','offhand',{def:2}),ring1:item('Ring','ring1',{atk:3})};
 for(const [slot,x] of [['weapon',item('Wand','weapon',{spell:3})],['offhand',item('Tome','offhand',{mana:9})],['ring1',item('Ring','ring1',{spell:3})],['ring2',item('Ring','ring2',{def:3})],['armor',item('Armor','armor',{armorType:'Cloth',def:2})]])assert.equal(N.investmentGain(x,p,slot,gear),N.investmentGain(x,b,slot,gear));
});
test('hands-only never adds commitment, non-hand gain remains B',()=>{
 const p={...F.profile('smart-fury-daggers','H'),adaptiveNodes:['affinity_fury',...Array(20).fill('node')]},b=B.profile('smart-fury-daggers','B');
 const gear={weapon:item('Sword','weapon',{atk:3}),offhand:item('Shield','offhand',{def:100}),ring1:item('Ring','ring1',{atk:3})};
 assert.equal(N.commitmentBonus(item('Daggers','weapon'),p,'weapon'),0);
 assert(N.investmentGain(item('Two-Handed','weapon',{atk:4}),p,'weapon',gear)<0);
 assert.equal(N.investmentGain(item('Ring','ring1',{spell:3}),p,'ring1',gear),N.investmentGain(item('Ring','ring1',{spell:3}),b,'ring1',gear));
});
test('ring-only changes merchant targets and no other score or target',()=>{
 const b=B.profile('smart-arcane-arcane-pure','B'),ring=item('Ring','ring1',{spell:3}),wand=item('Wand','weapon',{spell:3});
 for(const arm of ['G','H','I'])assert.deepEqual(N.merchantDecisionTargets(ring,F.profile('smart-arcane-arcane-pure',arm)),['ring1']);
 const p=F.profile('smart-arcane-arcane-pure','J');
 assert.deepEqual(N.merchantDecisionTargets(ring,p),['ring1','ring2']);assert.deepEqual(N.merchantDecisionTargets(wand,p),['weapon']);
 assert.equal(N.investmentGain(ring,p,'ring1',{}),N.investmentGain(ring,b,'ring1',{}));
});
test('conservative selection rejects regressions and keeps B on ties',()=>{
 const b={endLevelMean:8,stuckE1:1,reachedE5:43,reachedE10:34,clearedE10:34,weaponMatched:90,weaponObserved:100,armorMatched:99,armorObserved:100,errors:0,issues:0,invalidInvestments:0,earlyTimeouts:0};
 assert.equal(F.recommendation({B:b,G:{...b},H:{...b,stuckE1:2,clearedE10:40},I:{...b,weaponMatched:100,reachedE5:42}}).recommended,'B');
 assert.equal(F.recommendation({B:b,G:{...b,weaponMatched:92},H:{...b},I:{...b}}).recommended,'G');
});
