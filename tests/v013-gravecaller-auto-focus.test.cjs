'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
const C=require('../scripts/v013-elite-tank-parity.cjs');
const FIXTURE_SEED=16003; // first verified Gravecaller/Tank paired seed in Stage 9.11.
function encounter(seed=FIXTURE_SEED){
 const probe=C.scenario(seed,'elite','starter',{inspectOnly:true});
 assert.equal(probe.initial.eliteType,'gravecaller','fixture seed changed');
 const a=create(seed,undefined,{}, {skipPersistence:true,now:1720000000000+seed});
 a.start(1,true);
 const c=a.controller(),g=c.state;
 c.chooseRealm(g.dungeon.cards[0].id);
 assert.equal(c.visitRoom(1),true);
 g.selected.elite=true;g.selected.mobCount=1;g.selected.escorts=0;
 assert.equal(a.enter(),true);
 const run=a.state().run;
 assert.equal(run.encounterLeader?.eliteType,'gravecaller');
 return {a,run};
}
test('native combat auto-focuses actual Gravecaller summons without changing other combat mechanics',()=>{
 const {a,run}=encounter();
 let sawLiving=false,sawFocus=false;
 for(let ticks=0;ticks<2000&&run.status==='fight'&&run.hp>0;ticks++){
  a.tick();
  if(run.enemies?.some(m=>m.hp>0&&m.stage83Summoned&&m.stage83Summoner==='elite'))sawLiving=true;
  if((run.metrics?.gravecallerAutoTargetSwitches||0)>0){sawFocus=true;break;}
 }
 assert.equal(sawLiving,true,'real undead were summoned before encounter ended');
 assert.equal(sawFocus,true,'auto-target must switch onto a real summoned undead');
 assert.equal(run.enemy?.stage83Summoned,true);
 assert.equal(run.enemy?.stage83Summoner,'elite');
 assert.equal(run.gravecallerManualTarget,undefined);
});
test('manual Gravecaller focus blocks auto changes after native undead are summoned',()=>{
 const {a,run}=encounter();
 run.gravecallerManualTarget=run.encounterLeader;
 let minions=false;
 for(let ticks=0;ticks<2000&&run.status==='fight'&&run.hp>0;ticks++){
  a.tick();
  if(run.enemies?.some(m=>m.hp>0&&m.stage83Summoned&&m.stage83Summoner==='elite')){
   minions=true;
   // Remain in combat for another 1.1 seconds (the auto interval is 0.88s).
   for(let t=0;t<10&&run.status==='fight'&&run.hp>0;t++)a.tick();
   break;
  }
 }
 assert.equal(minions,true,'manual lock is tested while real Minions exist');
 assert.equal(run.metrics?.gravecallerAutoTargetSwitches||0,0);
 assert.equal(run.gravecallerManualTarget,run.encounterLeader);
});
test('the live and GitHub Pages modules and manual UI override remain in sync',()=>{
 for(const path of ['online/v013-elite-abilities.js','combat/v012-combat-runtime.js']){
  assert.equal(fs.readFileSync(path,'utf8'),fs.readFileSync('docs/'+path,'utf8'));
 }
 for(const path of ['index.html','docs/index.html']){
  const html=fs.readFileSync(path,'utf8');
  assert(html.includes('r.gravecallerManualTarget=r.gravecallerManualTarget===mob?null:mob'));
  assert(html.includes('phase3GravecallerTargetNote(r)'));
  assert(html.includes('tap the selected enemy again to resume automatic Minion priority'));
 }
 const runtime=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 assert(runtime.includes('r.combatSeconds+.88'));
 assert(runtime.includes("ports.phase6Metric(r,'gravecallerAutoTargetSwitches',1)"));
 assert(runtime.includes('ports.phase3RetargetGroup?.()'));
 const natural=fs.readFileSync('scripts/v013-natural-progression.cjs','utf8');
 const control=fs.readFileSync('scripts/simulate-progression.cjs','utf8');
 assert(natural.includes('r.simulationTargetPolicy=true'));
 assert(control.includes('r.simulationTargetPolicy=true'));
});
