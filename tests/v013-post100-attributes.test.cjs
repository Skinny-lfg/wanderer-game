'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
test('100 Talent points stay capped, XP and player level keep increasing, and attributes start only AFTER the cap',()=>{
 let p=T.create();
 assert.equal(T.earned(p),0);
 p=T.award(p,10000);
 assert.equal(T.earned(p),100);
 assert.equal(T.attributeBudget(p),0);
 assert.equal(T.allocateAttribute(p,'agi'),null);
 p=T.award(p,100);
 assert.equal(p.xp,10100);
 assert.equal(T.earned(p),100,'Talent Tree never gains a 101st point');
 assert.equal(T.attributeBudget(p),1);
 assert.equal(T.availableAttributes(p),1);
 p=T.allocateAttribute(p,'agi');
 assert(p&&T.valid(p));
 assert.equal(p.attributes.agi,1);
 assert.equal(T.availableAttributes(p),0);
 assert.equal(T.allocateAttribute(p,'agi'),null,'cannot overspend the current earned level');
 p=T.award(p,200);
 assert.equal(T.attributeBudget(p),3);
 p=T.allocateAttribute(p,'str');
 p=T.allocateAttribute(p,'end');
 assert.equal(T.availableAttributes(p),0);
 assert.equal(p.attributes.agi+p.attributes.str+p.attributes.end,3);
});
test('Forged or corrupt permanent stats are rejected by native TalentGraph and Camp save validation',()=>{
 const base=T.award(T.create(),10200);
 for(const invalid of [
  {agi:3},{agi:-1},{agi:1.5},{agi:Infinity},{agi:'1'},{agi:1,speed:1},
  ['agi'],null
 ])assert.equal(T.valid({...base,attributes:invalid}),false,JSON.stringify(invalid));
 assert.equal(T.allocateAttribute(base,'luc'),null);
 const spent=T.allocateAttribute(base,'int');
 assert(T.valid(spent));
 assert.equal(T.valid({...spent,xp:10000}),false,'XP cannot be removed after points were spent');
 assert.equal(T.valid({...spent,attributes:{agi:2,int:1}}),false);
});
test('Main stats persist through talent reset and affect actual native combat stats',()=>{
 const a=create(10701,undefined,{}, {skipPersistence:true,now:1720000010701});
 const before=a.baseStats(),T=a.talents;
 a.state().automaticTalents=T.award(a.state().automaticTalents,10200);
 assert(a.talentActions.attribute('str'));
 assert(a.talentActions.attribute('end'));
 assert.equal(a.talentActions.attribute('agi'),false);
 assert.equal(a.state().automaticTalents.xp,10200);
 const after=a.baseStats();
 assert.equal(after.str,before.str+1);
 assert.equal(after.end,before.end+1);
 assert(after.attack>before.attack&&after.maxhp>before.maxhp);
 const breakdown=a.statSources(after);
 assert(breakdown.find(x=>x.key==='str').talents>=1);
 assert(breakdown.find(x=>x.key==='end').talents>=1);
 assert(a.talentActions.reset());
 assert.equal(a.state().automaticTalents.nodes.length,0);
 assert.equal(a.state().automaticTalents.attributes.str,1);
 assert.equal(a.state().automaticTalents.attributes.end,1);
 assert.equal(a.baseStats().maxhp,after.maxhp,'talent-only reset cannot erase permanent attributes');
 a.start(1,true);
 assert.equal(a.talentActions.attribute('agi'),false,'cannot allocate stats mid-Expedition');
});
test('Natural agent spends only actually earned post-cap points via live Camp transactions',()=>{
 const a=create(10702,undefined,{}, {skipPersistence:true,now:1720000010702});
 const t=a.talents;
 a.state().automaticTalents=t.award(t.create(),10400);
 const beforeXp=a.state().automaticTalents.xp;
 const result=N.spendEarnedAttributes(a,N.PROFILES.cautious);
 assert.equal(result.chosen.length,4);
 assert.equal(result.spent,4);
 assert.equal(result.unspent,0);
 assert.equal(a.state().automaticTalents.xp,beforeXp);
 assert(t.valid(a.state().automaticTalents));
 assert.equal(t.attributeBudget(a.state().automaticTalents),4);
 assert.equal(N.spendEarnedAttributes(a,N.PROFILES.cautious).chosen.length,0);
});
