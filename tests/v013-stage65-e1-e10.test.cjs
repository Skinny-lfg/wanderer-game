'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../scripts/v013-natural-progression.cjs');
const R=require('../scripts/v013-stage65-e1-e10-report.cjs');
function mock(){
 const gear={total:3,starter:3,items:[{slot:'weapon',subtype:'Sword',rarity:'Common',startingGear:true}]};
 const row={level:1,attempt:1,status:'defeat',bossWon:false,bossReached:false,
  before:{xp:0,earned:0,spent:0,unlocked:1,gear,talentNodes:[],element:'arcane'},
  rooms:[{roomType:'combat',won:false,died:true,hpStart:100,hpEnd:0,hpMax:100,
   mpStart:10,mpEnd:0,mpMax:10,manaSpent:10,infusionActivations:1,infusionHits:2,infusionDamage:20,
   fundedCasts:0,unfundedCasterAttacks:3}],xpEarned:10,gearAfter:gear};
 return {source:'fp',runnerSha256:'runner',settings:{maxLevel:10},integrity:{noForcedLevelUnlock:true},
  accounts:[{seed:5,profile:'magic-fire',reached:[1],endLevel:1,attempts:[row],talents:[],finalGear:gear,stopReason:'E1 unbeaten'}]};
}
test('E10 is genuinely censored when no native Boss unlocks later expeditions',()=>{
 const x=R.summarize([mock()]),e1=x.levels[0];
 assert.equal(x.reachedE10,0);assert.equal(x.clearedE10,0);
 assert.equal(x.levels[9].observed,'not_reached');
 assert.equal(e1.clears,0);assert.equal(e1.manaSpent,10);assert.equal(e1.infusionHits,2);
 assert.equal(e1.lowManaFallbackAttacks,3);
 assert.equal(x.profiles[0].weaponUsageOnExpeditionEntry.Sword,1);
});
test('Duplicate accounts and fabricated E2/E10 unlocks are rejected by analysis',()=>{
 const sample=mock();
 assert.throws(()=>R.summarize([sample,sample]),/Repeated natural account/);
 const bad=mock();bad.accounts[0].attempts[0].level=10;
 assert.throws(()=>R.summarize([bad]),/Impossible native unlock/);
});
test('Arcane, Wand and Staff profiles exist without fabricated starting gear',()=>{
 for(const id of ['magic-arcane','magic-wand','magic-staff']){
  assert(N.PROFILES[id],id);assert(N.PROFILES[id].families.includes('magic'),id);
  assert(N.PROFILES[id].armor==='Cloth',id);
 }
 assert.deepEqual(N.PROFILES['magic-wand'].weapons,['Wand']);
 assert.deepEqual(N.PROFILES['magic-staff'].weapons,['Staff']);
});
test('Every natural fight exposes actual per-fight Mana and infusion telemetry',()=>{
 const cfg=N.parseArgs(['--seeds=9304','--profiles=magic-wand','--max-level=1','--max-attempts=1']);
 const r=N.run(cfg),attempt=r.accounts[0].attempts[0];
 assert.equal(r.coverage.errors,0,JSON.stringify({error:attempt.error,diagnostic:attempt.diagnostic}));
 assert(attempt.rooms.length>0,'Real E1 fight required');
 for(const fight of attempt.rooms){
  for(const key of ['mpStart','mpEnd','mpMax','manaSpent','fundedCasts','infusionActivations',
   'infusionHits','infusionDamage','unfundedCasterAttacks'])
   assert(Number.isFinite(fight[key]),'Missing '+key);
  assert(fight.manaSpent>=0&&fight.infusionActivations>=0);
 }
});
test('No static report invents simulator drops, combat coefficients or XP',()=>{
 const script=fs.readFileSync('scripts/v013-stage65-e1-e10-report.cjs','utf8');
 for(const bad of ['setUnlocked(','.makeItem(','.award(','.encounter('])assert(!script.includes(bad),bad);
});
