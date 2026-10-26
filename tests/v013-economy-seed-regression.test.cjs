const test=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');

test('E1 seed 2 resolves required passive choices through Realm 13 and completes without state forcing',()=>{
 const a=create(2),s=a.state(),g=a.controller().state;a.setup(1,'Bow','Rare');g.unlocked=1;
 let actionCount=0,seenRealms=new Set();a.streams(2,2,2,2);a.start(1);a.initial('decay');
 while(!['finished','failed'].includes(g.stage)&&actionCount++<2500){
  if(s.run?.status==='fight'){const current=s.run,enemy=current.enemy;let ticks=0;while(s.run===current&&current.status==='fight'&&current.enemy===enemy&&ticks++<5000)a.tick();assert(ticks<5000,'bounded combat');a.flush();continue;}
  if(a.events.run()?.event){const item=a.bag.items()[0],passive=a.build().picks.find(id=>id!==a.build().initialPassive),family=a.controller().allowed()[0],target=Object.values(s.equip).find(Boolean);let chosen=false;for(let option=0;option<3&&!chosen;option++)chosen=a.events.choose(option,item?.id,passive,family,target?.id);assert(chosen,'event choice resolves');continue;}
  if(a.draft()?.kind==='reward'){const options=a.draft().options;assert(options.length>0,'pending passive reward has legal choice');assert.equal(a.passive(options[0].id),true,'mandatory passive choice accepted');continue;}
  if(a.draft()?.step==='element'){a.element('fire');continue;}
  if(s.run?.status==='cleared'||a.results().eventExitPending||a.results().review){assert.equal(a.exitResult(),true,'resolved realm exits explicitly');continue;}
  if(g.stage==='choice'){if(g.rewardPending){assert(a.draft()?.kind==='reward','completed Realm has a pending required passive');continue;}seenRealms.add(g.planeIndex);if(a.bag.overflow())while(a.bag.overflow())a.bag.discard(a.bag.items().at(-1).id);const offers=g.offers;assert(offers.length,'valid Realm offers exist');const offered=offers.find(p=>p.family==='decay')||offers[0];assert(a.select(offered.id),'valid offered Realm selected');const entered=a.enter();if(!entered)assert(a.bag.overflow()>0||a.bag.items().length>=a.bag.capacity(),'entry must be blocked by its actual bag capacity rule');else if(a.draft()?.step==='element')a.element('fire');continue;}
  assert.fail('unexpected engine state: '+JSON.stringify({stage:g.stage,realm:g.planeIndex,draft:a.draft(),status:s.run?.status,review:a.results().review}));
 }
 assert.equal(g.stage,'finished','Expedition completed');assert(seenRealms.has(12),'reproduced Realm 13');assert.equal(g.history.length,15);assert.equal(s.pendingRuneReward?.options?.length,3,'boss Rune choice remains pending');
 assert.equal(a.claimRune(s.pendingRuneReward.options[0].id),true,'one boss Rune selected exactly once');assert.equal(a.claimRune(s.pendingRuneReward?.options?.[0]?.id),false,'Rune reward cannot be duplicated');
});
