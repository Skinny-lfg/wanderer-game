'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-map-intelligence.js');
require('../economy/v013-crafting.js');
require('../online/v013-expedition-contracts.js');
const F=globalThis.WandererV013ExpeditionFoundation,K=globalThis.WandererV013ExpeditionContracts,C=globalThis.WandererV013Crafting;
const create=require('./v012-economy-harness.cjs'),clone=x=>JSON.parse(JSON.stringify(x));
function fresh(seed=7711,risk=0){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.start(1,true);
 const c=a.controller(),card=c.state.dungeon.cards[risk];c.chooseRealm(card.id);
 return {a,c,card,g:c.state,d:c.state.dungeon};
}
function chosen(seed=7720,id='pathfinder'){
 for(let x=seed;x<seed+70;x++){
  const env=fresh(x),offer=env.c.offerContracts();
  if(offer.ids.includes(id)){env.c.chooseContract(id);return env;}
 }
 throw Error('Contract not offered on 70 generated maps: '+id);
}
function complete(env,id){
 const {g,d,card}=env;
 if(id==='bounty_writ'){
  d.foundationState=F.applyDecision(d.foundationState,{type:'prepare_boss',source:'markedElite'},d.foundationManifest);
  d.cleared.push(card.objective);d.visited.push(card.objective);
 }else if(id==='pathfinder'){
  // Actual controller history, not scouted/forged visit counters.
  for(const node of [1,2]){d.cleared.push(node);d.visited.push(node);g.history.push({node,event:null,boss:false});}
 }else if(id==='purification'){
  d.foundationState=F.applyDecision(d.foundationState,{type:'prepare_boss',source:'reliquary'},d.foundationManifest);
  d.disabledBossModifierId=d.foundationState.bossModifierIds[0];
 }else if(id==='oath_of_defiance'){
  const boss=card.nodes.length-1;
  d.cleared.push(boss);d.visited.push(boss);g.history.push({node:boss,boss:true,event:null});
  g.stage='finished';
 }else throw Error('Unknown synthetic completion');
}
test('Stage 7.2 catalogue retains 4 lore Contracts and exclusive reward plans',()=>{
 assert.deepEqual(K.CATALOG.map(c=>c.id),['bounty_writ','pathfinder','purification','oath_of_defiance']);
 for(const entry of K.CATALOG){
  assert(K.DESCRIPTIONS[entry.id]?.objective&&K.DESCRIPTIONS[entry.id]?.detail);
  let previous=0;
  for(let risk=0;risk<=2;risk++){
   const prize=K.reward(entry.id,risk);
   assert.equal(prize.kind,'essence');assert(prize.essence>previous);
   assert(!Object.hasOwn(prize,'fragments'));previous=prize.essence;
  }
 }
 assert.throws(()=>K.reward('fake',1),/Invalid/);
 const env=fresh(7111,2),p=K.plan(env.d.foundationManifest.seed,env.card,[]);
 assert.equal(p.ids.length,2);
 assert.deepEqual(p,K.plan(env.d.foundationManifest.seed,env.card,[]));
 assert.equal(p.rewards[p.ids[1]].kind,'essence');
 assert(['blueprint','essence'].includes(p.rewards[p.ids[0]].kind));
 for(const prize of Object.values(p.rewards))assert.equal(Object.keys(prize).includes('fragments'),false);
});
test('Stage 7 generates two distinct feasible options on all real three-card maps, independently of other RNG',()=>{
 const {d}=fresh(7001);
 for(const card of d.cards)for(let seed=0;seed<120;seed++){
  const ids=K.offer(seed,card);
  assert.equal(ids.length,2);
  assert.equal(new Set(ids).size,2);
  assert.deepEqual(ids,K.offer(seed,card));
  assert(ids.every(id=>K.eligible(card,id)),card.id+' has impossible contract');
 }
 for(const card of d.cards)assert(K.offer(23,card).length===2);
 const card=d.cards[0],broken=clone(card);broken.nodes[broken.objective].kind='event';
 assert.equal(K.eligible(broken,'bounty_writ'),false);
 const blocked=clone(card);blocked.edges=[];assert.equal(K.eligible(blocked,'purification'),false);
});
test('Stage 7 makes contract choice optional and mandatory-to-resolve before Boon and map travel',()=>{
 const {c,g}=fresh(7712),offer=c.offerContracts(),boons=c.offerBoons(['blood']);
 assert.equal(offer.ids.length,2);assert.equal(boons.ids.length,3);
 assert.equal(K.validate(g),true);assert.equal(c.visitRoom(1),false);
 assert.throws(()=>c.chooseBoon(boons.ids[0]),/unavailable/);
 assert.throws(()=>c.chooseContract('impossible'),/unavailable/);
 assert.equal(c.chooseContract(null),null);
 assert.equal(K.inspect(g).status,'ignored');
 assert.throws(()=>c.chooseContract(offer.ids[0]),/unavailable/);
 assert.equal(c.chooseBoon(boons.ids[0]),boons.ids[0]);
 assert(c.visitRoom(1));
 assert.equal(K.validate(g),true);
 assert.equal(c.restore(clone(g)).dungeon.foundationState.decisions.some(x=>x.type==='skip_contract'),true);
});
test('Stage 7 contract selection is replay-safe; forged options and alternate selected IDs are rejected',()=>{
 const {c,g}=fresh(7713),o=c.offerContracts(),original=clone(g);
 const forged=clone(original);forged.dungeon.contractOffer.ids[0]='fake_contract';
 assert.throws(()=>c.restore(forged),/Invalid/);
 assert.deepEqual(clone(g),original);
 c.chooseContract(o.ids[0]);
 assert.equal(g.dungeon.foundationState.contractId,o.ids[0]);
 assert.equal(K.validate(g),true);
 const saved=clone(g);assert.equal(c.restore(saved).dungeon.foundationState.contractId,o.ids[0]);
 const wrong=clone(saved);wrong.dungeon.foundationState.decisions.find(x=>x.type==='select_contract').id=K.CATALOG.find(x=>!o.ids.includes(x.id)).id;
 wrong.dungeon.foundationState.contractId=wrong.dungeon.foundationState.decisions.find(x=>x.type==='select_contract').id;
 assert.throws(()=>c.restore(wrong),/Invalid/);
 assert.equal(c.state.dungeon.foundationState.contractId,o.ids[0]);
});
test('Stage 7 Pathfinder counts two completed sectors, not scouting or manually added visited rooms',()=>{
 const env=chosen(7720,'pathfinder'),{g,d}=env;
 d.scouted.push(1,2);d.visited.push(1,2);
 assert.deepEqual(K.progress(g),{current:0,target:2,done:false});
 d.scouted.length=0;d.visited.length=1;
 d.cleared.push(1);d.visited.push(1);g.history.push({node:1,event:null});
 assert.deepEqual(K.progress(g),{current:1,target:2,done:false});
 d.cleared.push(5);d.visited.push(5);g.history.push({node:5,event:null});
 assert.equal(K.progress(g).current,1,'same passage must not double count');
 d.cleared.push(2);d.visited.push(2);g.history.push({node:2,event:null});
 assert.equal(K.progress(g).done,true);
});
test('Stage 7.2 Bounty Writ grants one exclusive reward, never Elite reagent or Fragments twice',()=>{
 const env=chosen(7780,'bounty_writ'),{a,g,d,card}=env;
 assert.equal(K.progress(g).done,false);
 const promised=d.stage72RewardPlan.rewards.bounty_writ;
 complete(env,'bounty_writ');
 const before={essence:a.state().crafting.essence,fragments:a.state().fragments,cores:a.state().crafting.cores[card.family]};
 const payout=K.settle(g,a.state(),a.results());
 assert.equal(payout.id,'bounty_writ');assert.equal(payout.kind,promised.kind);
 assert.equal(a.state().fragments,before.fragments,'optional Contracts never pay Fragments');
 assert.equal(a.state().crafting.cores[card.family],before.cores,'Elite reagent paid by separate native path');
 if(promised.kind==='blueprint'){
  assert.equal(payout.recipeId,promised.recipeId);
  assert.equal(C.unlocked(a.state().crafting,payout.recipeId),true);
  assert.equal(a.state().crafting.essence,before.essence);
  assert(!Object.hasOwn(payout,'essence'));
 }else{
  assert.equal(payout.essence,promised.essence);
  assert.equal(a.state().crafting.essence-before.essence,payout.essence);
  assert(!Object.hasOwn(payout,'recipeId'));
 }
 assert.equal(K.validate(g),true);
 const after=clone(a.state().crafting);
 assert.equal(K.settle(g,a.state(),a.results()),null);
 assert.deepEqual(clone(a.state().crafting),after);
 assert.equal(canonicalReplay(g).completedObjectives[0],'bounty_writ');
});
function canonicalReplay(g){
 const {foundationState:s,foundationManifest:manifest,realm}=g.dungeon;
 return F.replayDecisions(manifest,realm,s.decisions.map(({seq,...action})=>action));
}
test('Stage 7.2 pays each accepted Contract exactly once and displays the correct exclusive type',()=>{
 for(const id of K.CATALOG.map(x=>x.id)){
  const env=chosen(7840,id),{a,g,d}=env,promised=d.stage72RewardPlan.rewards[id];
  complete(env,id);assert.equal(K.progress(g).done,true,id);
  assert.equal(K.validate(g),true);
  const before=clone(a.state().crafting),frags=a.state().fragments;
  const paid=K.settle(g,a.state(),a.results());
  assert.equal(paid.kind,promised.kind);
  assert.equal(a.state().fragments,frags);
  if(paid.kind==='blueprint'){assert.equal(paid.recipeId,promised.recipeId);assert(C.unlocked(a.state().crafting,paid.recipeId));assert.equal(a.state().crafting.essence,before.essence);}
  else{assert.equal(paid.essence,promised.essence);assert.equal(a.state().crafting.essence-before.essence,paid.essence);}
  assert.equal(K.inspect(g).status,'completed');
  assert.equal(K.settle(g,a.state(),a.results()),null);
  assert.equal(K.validate(g),true);
 }
});
test('Stage 7 Oath of Defiance fails if any boss seal was disabled',()=>{
 const env=chosen(7960,'oath_of_defiance'),{a,g,d,card}=env;
 const boss=card.nodes.length-1;g.stage='finished';d.cleared.push(boss);d.visited.push(boss);
 assert(K.progress(g).done);
 d.foundationState=F.applyDecision(d.foundationState,{type:'prepare_boss',source:'reliquary'},d.foundationManifest);
 d.disabledBossModifierId=d.foundationState.bossModifierIds[0];
 assert.equal(K.progress(g).done,false);
 assert.equal(K.settle(g,a.state(),a.results()),null);
 assert.equal(K.inspect(g,'victory').status,'failed');
});
test('Stage 7 incomplete, abandoned and ignored contracts grant no extra resources',()=>{
 const env=chosen(8001,'purification'),{a,g}=env;
 const wallet=clone({essence:a.state().crafting.essence,fragments:a.state().fragments});
 assert.equal(K.settle(g,a.state(),a.results()),null);
 assert.equal(K.inspect(g,'extracted').status,'failed');
 assert.equal(K.inspect(g,'defeat').status,'failed');
 assert.equal(K.inspect(g,'abandoned').status,'failed');
 assert.deepEqual({essence:a.state().crafting.essence,fragments:a.state().fragments},wallet);
 const other=fresh(8002);other.c.offerContracts();other.c.chooseContract(null);
 assert.equal(K.inspect(other.g,'extracted').status,'ignored');
 assert.equal(K.settle(other.g,other.a.state(),other.a.results()),null);
});
test('Stage 7 cannot be paid on a forged completion or a duplicated reward record',()=>{
 const env=chosen(8003,'pathfinder'),{c,g,d,a}=env;
 const wrong=clone(g);
 wrong.dungeon.stage7RewardPaid={id:'pathfinder',kind:'essence',essence:100};
 assert.throws(()=>c.restore(wrong),/Invalid/);
 complete(env,'pathfinder');
 K.settle(g,a.state(),a.results());
 const copy=clone(g);copy.dungeon.stage7RewardPaid.kind='blueprint';
 assert.throws(()=>c.restore(copy),/Invalid/);
 assert.equal(K.validate(g),true);
});
test('Stage 7 old Stage 6 checkpoints without optional contract state remain restorable',()=>{
 const {c,g}=fresh(8004);
 assert.equal(K.validate(g),true);
 assert.equal(c.restore(clone(g)).dungeon.foundationState.contractId,null);
 assert.equal(c.state.dungeon.contractOffer,undefined);
});

test('Stage 7 native abandonment records failed or ignored contracts in the real expedition summary',()=>{
 const accepted=chosen(8080,'purification'),before=accepted.a.state().fragments;
 assert.equal(accepted.a.abandon(),true);
 assert.equal(accepted.g.stage,'failed');
 assert.equal(accepted.a.results().summary?.outcome,'abandoned');
 assert.equal(accepted.a.results().summary?.contract?.status,'failed');
 assert.equal(accepted.a.state().fragments,before);
 const declined=fresh(8090);declined.c.offerContracts();declined.c.chooseContract(null);
 assert.equal(declined.a.abandon(),true);
 assert.equal(declined.a.results().summary?.contract?.status,'ignored');
});

test('Stage 7.2 chooses Blueprint from the selected Dungeon affinity and risk tier',()=>{
 for(const risk of [0,1,2]){
  const {d,card}=fresh(9941+risk,risk);
  const offer=K.plan(d.foundationManifest.seed,card,[]);
  const prize=offer.rewards[offer.ids[0]];
  assert.equal(offer.rewards[offer.ids[1]].kind,'essence');
  assert.equal(prize.kind,'blueprint');
  const recipe=C.RECIPES.find(r=>r.id===prize.recipeId);
  assert(recipe);assert.equal(recipe.family,card.family);
  assert.equal(recipe.rarity,risk===2?'Epic':'Rare');
  assert.equal(K.label(prize),recipe.rarity+' Blueprint · '+recipe.name);
 }
});
test('Stage 7.2 previously learned Blueprints never appear again; completed collection yields Essence',()=>{
 const env=fresh(9518,2),{d,card}=env,seed=d.foundationManifest.seed;
 const all=C.RECIPES.filter(r=>r.family===card.family&&r.rarity!=='Uncommon').map(r=>r.id);
 const initial=K.plan(seed,card,[]);
 assert.equal(initial.rewards[initial.ids[0]].kind,'blueprint');
 const next=K.plan(seed,card,[initial.rewards[initial.ids[0]].recipeId]);
 assert.equal(next.rewards[next.ids[0]].kind,'blueprint');
 assert.notEqual(next.rewards[next.ids[0]].recipeId,initial.rewards[initial.ids[0]].recipeId);
 const finished=K.plan(seed,card,all);
 assert(finished.ids.every(id=>finished.rewards[id].kind==='essence'));
 assert.throws(()=>K.plan(seed,card,['unknown']),/Invalid/);
});
test('Stage 7.2 canonical reward plan cannot be replaced, increased or changed in a checkpoint',()=>{
 const env=chosen(9813,'pathfinder'),{c,g,d}=env;
 const base=clone(g),selected=d.foundationState.contractId,prize=d.stage72RewardPlan.rewards[selected];
 const mutations=[
  state=>{state.dungeon.stage72RewardPlan.rewards[selected]={kind:'essence',essence:9999};},
  state=>{state.dungeon.stage72RewardPlan.rewards[selected]={kind:'blueprint',recipeId:'epic_sanguine_edge'};},
  state=>{state.dungeon.stage72RewardPlan.knownRecipes.push('unknown');},
  state=>{state.dungeon.stage72RewardPlan.ids.reverse();}
 ];
 for(const mutate of mutations){
  const forged=clone(base);mutate(forged);
  assert.throws(()=>c.restore(forged),/Invalid/);
 }
 assert.deepEqual(d.stage72RewardPlan.rewards[selected],prize);
 const offered=fresh(9814),o=offered.c.offerContracts(),tampered=clone(offered.g);
 tampered.dungeon.contractOffer.rewards[o.ids[0]]={kind:'essence',essence:9999};
 assert.throws(()=>offered.c.restore(tampered),/Invalid/);
});
test('Stage 7.2 forged completion does not duplicate a real Blueprint, even before reward ledger is set',()=>{
 const env=chosen(9877,'bounty_writ'),{g,d,a}=env;
 complete(env,'bounty_writ');
 const reward=d.stage72RewardPlan.rewards.bounty_writ;
 if(reward.kind!=='blueprint')throw Error('Expected unowned Blueprint');
 a.state().crafting=C.discover(a.state().crafting,reward.recipeId);
 const initial=clone(a.state().crafting);
 assert.equal(K.settle(g,a.state(),a.results()),null);
 assert.equal(d.stage7RewardPaid,undefined);
 assert.deepEqual(clone(a.state().crafting),initial);
});
