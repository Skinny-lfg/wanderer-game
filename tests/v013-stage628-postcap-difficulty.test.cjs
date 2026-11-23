'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../scripts/v013-stage628-postcap-difficulty.cjs');
const T=globalThis.WandererAutomaticTalents;
const create=require('./v012-economy-harness.cjs');
test('Stage 6.28 uses an explicit E1/E200 progression curve and safe cohort options',()=>{
 assert.deepEqual(D.LEVELS,[1,5,20,35,55,70,100,150,200]);
 const cfg=D.parse(['--seed=9861','--profile=cautious','--max-level=200',
  '--max-total-attempts=360','--out=reports/v013-stage628-postcap-9861-cautious.json']);
 assert.equal(cfg.maxLevel,200);assert.equal(cfg.profile,'cautious');
 assert.throws(()=>D.parse(['--max-level=201']));
 assert.throws(()=>D.parse(['--profile=unknown']));
 assert.throws(()=>D.parse(['--out=../../outside.json']));
});
function syntheticFixture(){
 // Explicit test fixture. This is NOT a naturally earned E1 character!
 const a=create(62801,undefined,{}, {skipPersistence:true,now:1720000062801});
 let p=T.award(a.state().automaticTalents,10100);
 p=T.allocateAttribute(p,'end');assert(p&&T.valid(p));
 const state=a.state(),g=a.controller().state;
 return {seed:62801,profile:'synthetic-unit-test',level:1,
  state:{level:1,unlocked:g.unlocked,equip:JSON.parse(JSON.stringify(state.equip)),
   automaticTalents:p,runes:JSON.parse(JSON.stringify(state.runes||[])),
   runeSlots:JSON.parse(JSON.stringify(state.runeSlots||[]))},
  xp:p.xp,talentEarned:T.earned(p),attributeEarned:T.attributeBudget(p),
  attributeSpent:T.spentAttributes(p),attributes:T.attributes(p)};
}
test('Matched postcap native combat reads the same XP and gear, but END changes max HP',()=>{
 const snap=syntheticFixture(),scenario={type:'normal',id:'group-1',size:1,realm:'blood'};
 const pair=D.paired(snap,scenario,6280111);
 assert(pair.actual.hpMax>pair.noStats.hpMax);
 assert.equal(pair.actual.attributeSpent,1);
 assert.equal(pair.noStats.attributeSpent,0);
 assert.equal(pair.actual.attributes.end,1);
 assert.equal(pair.actual.seed,pair.noStats.seed);
 assert.equal(pair.actual.gearFingerprint,pair.noStats.gearFingerprint);
 assert.equal(pair.actual.leaderHp,pair.noStats.leaderHp);
 assert.equal(pair.actual.leaderAtk,pair.noStats.leaderAtk);
 assert.equal(pair.enemyIdentityVerified,true);
});
test('Unspent stats cannot be forged and before-cap paired control is identical by construction',()=>{
 const snap=syntheticFixture();
 snap.state.automaticTalents=T.award(T.create(),9000);
 snap.xp=9000;snap.talentEarned=90;snap.attributeEarned=0;
 snap.attributeSpent=0;snap.attributes=T.attributes(snap.state.automaticTalents);
 const pair=D.paired(snap,{type:'normal',id:'group-1',size:1,realm:'blood'},6280199);
 assert.equal(pair.noStats,null);
 assert.equal(pair.identicalByConstruction,true);
 assert.equal(pair.actual.attributes.end,0);
});
