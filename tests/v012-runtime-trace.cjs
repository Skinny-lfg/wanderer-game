// Bounded deterministic equivalence trace, not a balance/win-rate simulation.
const crypto=require('node:crypto'),create=require('./v012-economy-harness.cjs');
module.exports=function trace(scenario,source){
 const a=create(scenario.seed,source,{}, {now:1700000000000});a.setup(scenario.E,scenario.weapon,'Epic');
 const s=a.state(),g=a.controller().state;s.consumables={health:1,mana:1,fortune:1};s.potionSelection=['health','mana','fortune'];g.unlocked=scenario.E;
 const out=[];function record(){out.push(crypto.createHash('sha256').update(JSON.stringify({profile:a.state(),controller:a.controller().state,build:a.build(),integration:a.events.run(),results:a.results(),checkpoint:a.checkpoint.capture()})).digest('hex'));}
 a.start(scenario.E);a.initial(scenario.family);if(a.draft()?.step==='element')a.element(scenario.element||'fire');record();
 let restored=false;
 for(let i=0;i<150&&!['finished','failed'].includes(a.controller().state.stage);i++){
  if(a.draft()?.step==='passive')a.passive(a.draft().options[0].id);
  else if(a.results().review)a.exitResult();
  else if(a.events.run()?.event)a.events.choose(2);
  else if(a.state().run){
   for(let tick=0;tick<5&&a.state().run?.status==='fight';tick++)a.tick();
   if(!restored&&a.state().run){const cp=a.checkpoint.capture();a.checkpoint.restore(cp);a.checkpoint.resume();restored=true;}
   if(a.state().run){a.state().run.enemy.hp=0;a.win();a.flush();}
  }else if(a.controller().state.stage==='choice'){
   while(a.bag.overflow())a.bag.discard(a.bag.items().at(-1).id);
   if(a.controller().state.planeIndex===2){a.reroll(0);a.potions.use(1);}
   a.select(a.controller().state.offers[0].id);a.enter();if(a.draft()?.step==='element')a.element('lightning');
  }
  record();
 }
 if(!['finished','failed'].includes(a.controller().state.stage))throw Error('Trace did not terminate');
 if(a.state().pendingRuneReward){a.claimRune(a.state().pendingRuneReward.options[0].id);record();}
 return out;
};
