'use strict';
// S1 regression: real game rules are executed through the isolated native VM.
// Artificial XP/materials/unlocks are used ONLY to reach controlled test states;
// the persistent account runner must earn all of them through its own gameplay.
const test=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const N=require('../scripts/v013-natural-progression.cjs');
const S=require('../scripts/simulate-progression.cjs');
const make=(seed=113)=>create(seed,undefined,{}, {skipPersistence:true,now:1720000000000+seed});
const fund=(a,xp=10000)=>{const s=a.state();s.automaticTalents=a.talents.award(s.automaticTalents,xp);};

test('S1: all three Magic elements require earned points, root/choice, and native attunement',()=>{
 for(const element of ['fire','frost','lightning']){
  const a=make(130+['fire','frost','lightning'].indexOf(element)),s=a.state(),profile=N.PROFILES['arcane-'+element];
  assert.equal(a.talentActions.element(element),false,'element choice is locked at E1');
  fund(a,10000);
  const invested=N.spendEarnedTalents(a,profile),p=s.automaticTalents;
  assert.equal(p.xp,10000);assert(a.talents.valid(p));
  assert(p.nodes.includes('element_choice'),'earned Magic must acquire the choice node');
  assert.equal(p.element,element);
  assert(invested.elements.includes(element));
  assert(p.nodes.includes('affinity_arcane'));
  assert.equal(a.talents.earned(p),100);
  assert(a.start(1,true)!==false,'test fixture must start a native expedition');
  assert.equal(a.build().element,element,'selected mode must reach native combat build');
 }
});

test('S1: prepared abilities can only be selected after purchasing an advanced node',()=>{
 const a=make(141),s=a.state(),profile={...N.PROFILES.cautious,
  targets:['last_bastion','guarded_block','barrier_pulse','strong_heart'],
  preparedTargets:['last_bastion']};
 assert.equal(a.talentActions.prepare('last_bastion'),false);
 fund(a,10000);
 N.spendEarnedTalents(a,profile);
 const owned=s.automaticTalents.nodes.filter(id=>a.talents.NODES.find(n=>n.id===id)?.advanced);
 assert(owned.length>0,'fixture should earn an advanced ability via real prerequisites');
 const chosen=N.prepareEarnedAbility(a,profile);
 assert(chosen&&owned.includes(chosen));
 assert.equal(s.automaticTalents.prepared,chosen);
 assert(a.talents.valid(s.automaticTalents));
 assert.equal(a.talentActions.prepare('nonexistent'),false);
 assert.equal(s.automaticTalents.prepared,chosen);
 assert(a.start(1,true)!==false);
 assert.equal(a.build().runtime.prepared,chosen,'prepared ability must reach native combat runtime');
});

test('S1: free complete reset preserves earned XP, clears prepared choice and only works in Camp',()=>{
 const a=make(142),s=a.state();fund(a,5000);
 N.spendEarnedTalents(a,N.PROFILES.cautious);
 const spent=s.automaticTalents.nodes.length;
 assert(spent>=4);
 assert.equal(a.talentActions.reset(),true);
 assert.equal(s.automaticTalents.xp,5000);
 assert.deepEqual(Array.from(s.automaticTalents.nodes),[]);
 assert.equal(s.automaticTalents.prepared,null);
 assert(a.talents.valid(s.automaticTalents));
 a.start(1,true);
 assert.equal(a.talentActions.available(),false);
 assert.equal(a.talentActions.reset(),false);
 assert.equal(a.talentActions.allocate('root_aegis'),false);
 assert.equal(a.talentActions.element('frost'),false);
 assert.equal(a.talentActions.prepare(null),false);
});

test('S1: deterministic plan pivot spends previously earned XP without injecting XP or items',()=>{
 const a=make(143),s=a.state();fund(a,6000);
 const first=N.spendEarnedTalents(a,N.PROFILES.cautious);
 assert(first.spent>=4);
 const xpBefore=s.automaticTalents.xp,gearBefore=JSON.stringify(s.equip);
 const pivot=N.pivotProfile('cautious');
 const out=N.prepareCamp(a,pivot,1,'legacy',{resetReason:'two_undefeated_attempts_at_E1'});
 assert.equal(out.resets.length,1);assert.equal(out.resets[0].xpRetained,xpBefore);
 assert(out.talents.length>0);
 assert.equal(s.automaticTalents.xp,xpBefore);
 assert(a.talents.valid(s.automaticTalents));
 assert.equal(JSON.stringify(s.equip),gearBefore);
});

test('S1: controlled simulator also offers genuine Frost magic without altering existing presets',()=>{
 const b=S.BUILDS.find(x=>x.id==='arcane-frost');
 assert(b);assert.equal(b.element,'frost');
 const p=S.talentPlan(b,24);assert(S.BUILDS.length>=8);
 assert(p.nodes.includes('deep_winter'));assert.equal(p.element,'frost');
 assert(S.parseArgs(['--builds=arcane-frost','--levels=1','--seeds=1']).builds.includes('arcane-frost'));
});

test('S1: natural cohort still starts with no XP or fabricated equipment',()=>{
 const out=N.run({...N.DEFAULTS,seeds:[9951],profiles:['arcane-fire'],
  maxLevel:1,maxAttempts:1,maxTotalAttempts:1});
 assert.equal(out.coverage.errors,0);
 const attempt=out.accounts[0].attempts[0];
 assert.equal(attempt.before.xp,0);
 assert.equal(attempt.before.spent,0);
 assert.equal(Object.hasOwn(attempt.camp,'upgraded'),false);
 assert.equal(attempt.camp.resets.length,0);
});
