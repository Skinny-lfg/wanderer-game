'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

function encounter(count,{host='localhost',family='vitality',seed=18}={}){
 const a=create(seed,undefined,{}, {skipPersistence:true,measure:true,hostname:host,search:`?expeditionPhase1=1&gauntlet=${count}`});
 a.setup(1,'Sword','Epic');a.start(1);a.initial(family);
 const g=a.controller().state,offer=g.offers.find(x=>x.family===family&&!x.elite&&!x.boss&&!x.event)||g.offers.find(x=>!x.elite&&!x.boss&&!x.event);
 assert.ok(offer,'fixture needs a normal non-Event Realm');a.select(offer.id);a.enter();
 if(a.draft()?.step==='element')a.element('fire');
 if(a.draft()?.step==='passive')a.passive(a.draft().options[0].id);
 assert.equal(a.state().run?.status,'fight');
 return {a,offer};
}

test('local flag gates the integrated prototype; ordinary browser path stays on baseline Waves',()=>{
 const {a}=encounter(8,{host:'preview.example'});
 assert.equal(a.state().run.gauntlet,undefined);
 assert.equal(a.state().run.planeWaves,a.controller().state.selected.waves);
 const {a:local}=encounter(8);
 assert.equal(local.state().run.gauntlet.count,8);
});

test('baseline Wave rewards still pass their existing idempotency guard exactly once',()=>{
 const {a}=encounter(8,{host:'preview.example',seed:100001}),r=a.state().run;
 r.enemy.hp=0;a.win();
 assert.equal(r.status,'ready');assert.equal(a.results().gold,r.gold);assert.ok(r.gold>0);
 const awarded=r.gold;a.win();assert.equal(r.gold,awarded,'duplicate callback cannot issue a second reward');
});

test('8/10/12 micro-kills share player state and award only the original Realm reward budget',()=>{
 for(const count of [8,10,12]){
  const {a,offer}=encounter(count,{seed:100+count}),run=a.state().run,g=a.controller().state;
  const rewardGold=a.state().gold,rewardFragments=a.state().fragments,baselineWaves=offer.waves;
  const build=a.build();build.unlockedFamilies=['vitality'];build.initialFamily='vitality';build.initialPassive='strong_heart';build.picks=['strong_heart','second_breath'];
  run.hp=run.maxhp*.5;
  const mobIds=[];
  for(let i=0;i<count;i++){
   const enemy=run.enemy;mobIds.push(enemy.gauntletMobId);enemy.hp=0;assert.equal(a.win(),true);
   assert.equal(run.gauntlet.index,i+1);
   if(i<count-1){
    assert.equal(run.status,'fight');assert.equal(a.state().gold,rewardGold,'micro-kill cannot award Gold');
    assert.equal(a.state().fragments,rewardFragments,'micro-kill cannot award Fragments');
    assert.equal(a.results().earned.length,0,'micro-kill cannot award gear');
    assert.ok(run.enemy,'next enemy spawns without a Wave screen');
   }
  }
  assert.equal(new Set(mobIds).size,count);
  assert.equal(run.status,'cleared');assert.equal(g.stage,'choice');assert.ok(g.rewardPending,'passive reward remains required');
  assert.equal(run.gauntlet.kills.length,count);
  assert.equal(run.gauntlet.awardKeys.length,baselineWaves,'reward budget follows existing Waves, not micro-kills');
  assert.equal(a.state().gold-rewardGold,run.gold);
  assert.equal(a.state().fragments-rewardFragments,run.fragments);
  assert.ok(run.gold>=baselineWaves*3&&run.gold<=baselineWaves*6);
  assert.ok(run.fragments>=baselineWaves&&run.fragments<=baselineWaves*3);
  assert.equal(build.runtime.passiveTelemetry.second_breath.activations,1,'per-Wave heal runs once at encounter checkpoint');
  assert.ok(a.measured.healed>0);
  assert.equal(a.state().gold-rewardGold,run.gold,'one checkpoint contains all currency awards');
 }
});

test('mid-Gauntlet synthetic save resumes the same enemy and cannot award before completion',()=>{
 const {a}=encounter(8,{seed:77});const run=a.state().run;
 const first=run.enemy.gauntletMobId;run.enemy.hp=0;a.win();
 const second=run.enemy.gauntletMobId;assert.notEqual(second,first);
 const before={hp:run.hp,enemyHp:run.enemy.hp,index:run.gauntlet.index,id:second};
 const save=a.checkpoint.captureSave();
 assert.equal(save.expedition.session.activeRun.gauntlet.index,before.index);
 assert.equal(save.expedition.session.activeRun.enemy.gauntletMobId,before.id);
 assert.equal(save.expedition.session.seed,a.checkpoint.seed(),'reload checkpoint preserves the current deterministic RNG position');
 assert.equal(save.expedition.session.idCounter,save.idCounter,'reload checkpoint preserves the ID counter');
 const resumed=a.checkpoint.restoreSave(save);assert.equal(resumed,true);
 const restored=a.state().run;
 assert.equal(restored.gauntlet.index,before.index);assert.equal(restored.enemy.gauntletMobId,before.id);
 assert.equal(restored.hp,before.hp);assert.equal(restored.enemy.hp,before.enemyHp);
 assert.equal(a.checkpoint.seed(),save.expedition.session.seed);
 assert.equal(a.state().gold,save.profile.gold);
 for(let i=before.index;i<restored.gauntlet.count;i++){restored.enemy.hp=0;a.win();}
 assert.equal(restored.status,'cleared');
 assert.equal(a.checkpoint.captureSave().expedition.awardKeys.length,restored.planeWaves);
});
