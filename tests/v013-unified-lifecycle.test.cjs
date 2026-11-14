'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');require('../economy/v013-crafting.js');const C=globalThis.WandererV013Crafting;
function finish(a){for(let step=0;step<160;step++){const g=a.controller().state;if(['finished','failed'].includes(g.stage))return;if(a.state().run?.status==='cleared'||a.results().eventExitPending||a.results().review){a.exitResult();continue;}if(a.events.run()?.event){assert(a.events.choose(2));continue;}const r=a.state().run;if(r){r.hp=r.maxhp=100000;for(const e of r.enemies||[r.enemy])e.hp=0;a.win();a.flush();continue;}for(let n=0;a.bag.items().length>=a.bag.capacity()||a.bag.overflow();n++){assert(n<50);assert(a.bag.discard(a.bag.items().at(-1).id));}const offer=g.offers.find(p=>a.controller().reachable(p));assert(offer);a.select(offer.id);assert(a.enter());}throw Error('Expedition failed to terminate');}
for(const family of C.FAMILIES)test('tracked '+family+' project guides boss, secures materials and completes Rune/Camp lifecycle',()=>{const a=create(145),recipe=C.RECIPES.find(r=>r.family===family&&r.rarity==='Epic');assert(recipe);a.state().crafting=C.track(a.state().crafting,recipe.id);a.start(1,true);assert.equal(a.controller().state.contract,undefined);assert.equal(a.controller().state.bossFamily,family);a.rng(.99);finish(a);assert.equal(a.controller().state.stage,'finished');assert.equal(a.controller().state.unlocked,2);assert.equal(a.results().summary.outcome,'victory');assert.equal(a.state().pendingRuneReward.options.length,3);assert.equal(a.state().crafting.cores[family],1);assert(a.state().crafting.essence>=19);assert(C.unlocked(a.state().crafting,recipe.id));assert.equal(a.results().earned.length,0,'boss no longer guarantees equipment');const before=JSON.stringify(a.state().crafting);a.win();assert.equal(JSON.stringify(a.state().crafting),before);a.claimRune(a.state().pendingRuneReward.options[0].id);a.exitResult();assert.equal(a.results().review,null);});
test('defeat retains committed materials but grants no partial or boss reward',()=>{const a=create(146);a.start(1,true);let g=a.controller().state;a.select(g.offers[0].id);a.enter();const r=a.state().run;while(r.status==='fight'){r.enemy.hp=0;a.win();}const secured=JSON.stringify(a.state().crafting);a.exitResult();g=a.controller().state;a.select(g.offers.find(p=>a.controller().reachable(p)&&!p.event).id);a.enter();a.death();assert.equal(g.stage,'failed');assert.equal(JSON.stringify(a.state().crafting),secured);assert.equal(a.state().pendingRuneReward,null);});
test('directed craft and tracked goal survive local save/reload without repeated material awards',()=>{const storage=new Map(),a=create(148,undefined,{}, {sessionStorage:storage});a.state().fragments=100;a.state().crafting={...C.create(),essence:20,targetRecipe:'green_sword'};const result=C.prepareCraft(a.state(),'green_sword',1,a.makeItem);assert(result);Object.assign(a.state(),{fragments:result.fragments,crafting:result.crafting,stash:[...a.state().stash,result.item]});a.markAllSeen();const b=create(148,undefined,{}, {sessionStorage:storage});assert.equal(b.debug().saveBlocked,false);assert.equal(b.state().crafting.essence,16);assert.equal(b.state().crafting.targetRecipe,'green_sword');assert(b.state().stash.some(i=>i.id===result.item.id&&i.rarity==='Uncommon'));});


test('permanent affinities survive entering a different Realm and reloading without temporary choices',()=>{
 const storage=new Map(),a=create(145,undefined,{}, {sessionStorage:storage});
 a.state().automaticTalents={xp:1000,nodes:['might','affinity_blood'],element:'fire'};
 a.start(1,true);
 assert.equal(a.controller().state.initialFamily,null);
 assert.equal(a.controller().state.offers.length,3);
 assert.equal(a.initial('magic'),false);
 assert.equal(a.element('frost'),false);
 assert.equal(a.passive('kindling'),false);
 assert.deepEqual([...a.build().unlockedFamilies],['blood']);
 assert.equal(a.build().element,null);
 const offer=a.controller().state.offers.find(p=>p.family!=='blood');assert(offer);
 a.select(offer.id);assert(a.enter());
 assert.deepEqual([...a.build().families],['blood']);
 const b=create(145,undefined,{}, {sessionStorage:storage});
 assert.equal(b.debug().saveBlocked,false);
 assert.deepEqual([...b.build().unlockedFamilies],['blood']);
 assert.deepEqual([...b.build().families],['blood']);
 assert.equal(b.build().element,null);assert.equal(b.draft(),null);
});

test('validated Pages storage completes a one-encounter boss, Rune and reload into E2 exactly once',()=>{
 const fs=require('node:fs'),source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8').replace(/const PHASE5_VALIDATION=[^\n]+;/,'const PHASE5_VALIDATION=true;');
 const storage=new Map(),a=create(145,source,{}, {validationStorage:storage});a.start(1,true);a.rng(.99);finish(a);
 assert.equal(a.debug().saveBlocked,false);assert.equal(a.controller().state.unlocked,2);
 const materials=JSON.stringify(a.state().crafting);assert.equal(a.state().pendingRuneReward.options.length,3);
 a.claimRune(a.state().pendingRuneReward.options[0].id);a.exitResult();
 const b=create(145,source,{}, {validationStorage:storage});
 assert.equal(b.debug().saveBlocked,false);assert.equal(b.controller().state.unlocked,2);
 assert.equal(JSON.stringify(b.state().crafting),materials);assert.equal(b.state().pendingRuneReward,null);
 assert.equal(b.state().runes.length,1);b.start(2,true);assert.equal(b.controller().state.expedition,2);
 assert.equal(b.debug().saveBlocked,false);
});


test('Magic comes from its permanent root, not the route or an element preference',()=>{
 for(const nodes of [[],['haste','affinity_magic']]){
  const a=create(151);a.state().automaticTalents={xp:1000,nodes,element:'frost'};a.start(1,true);
  assert.deepEqual([...a.build().unlockedFamilies],nodes.length?['magic']:[]);
  assert.equal(a.build().element,nodes.length?'frost':null);
  const offer=a.controller().state.offers[0];a.select(offer.id);assert(a.enter());
  assert.deepEqual([...a.build().unlockedFamilies],nodes.length?['magic']:[]);
  assert.equal(a.draft(),null);
 }
});
