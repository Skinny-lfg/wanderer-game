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
test('Stage 7.5 keeps four lore Contracts and deterministic exclusive rewards',()=>{
 assert.deepEqual(K.CATALOG.map(c=>c.id),['bounty_writ','pathfinder','purification','oath_of_defiance']);
 const types=new Set();
 for(const entry of K.CATALOG)for(let risk=0;risk<=2;risk++){
  const prize=K.reward(entry.id,risk,'blood');
  types.add(prize.kind);assert(K.DESCRIPTIONS[entry.id]?.objective);
 }
 assert.deepEqual([...types].sort(),['fragments','gold','potion','reagent']);
 assert.throws(()=>K.reward('fake',1),/Invalid/);
 const env=fresh(7111,2),p=K.plan(env.d.foundationManifest.seed,env.card,[]);
 assert.equal(p.ids.length,2);assert.deepEqual(p,K.plan(env.d.foundationManifest.seed,env.card,[]));
 assert.equal(p.rewards[p.ids[0]].kind,'blueprint_chance');
 assert.equal(p.rewards[p.ids[0]].chance,.55);
 assert.notEqual(p.rewards[p.ids[1]].kind,'blueprint_chance');
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
test('Stage 7 contract selection precedes map travel, while Boons require discovered Shrines',()=>{
 const {c,g}=fresh(7712),offer=c.offerContracts();
 assert.equal(offer.ids.length,2);
 assert.equal(c.offerBoons(['blood']),null,'entry cannot offer Boons');
 assert.equal(K.validate(g),true);assert.equal(c.visitRoom(1),false);
 assert.throws(()=>c.chooseBoon('blood_tribute'),/unavailable/);
 assert.throws(()=>c.chooseContract('impossible'),/unavailable/);
 assert.equal(c.chooseContract(null),null);
 assert.equal(K.inspect(g).status,'ignored');
 assert.throws(()=>c.chooseContract(offer.ids[0]),/unavailable/);
 assert.equal(c.offerBoons(['blood']),null);
 assert(c.visitRoom(1));assert.equal(K.validate(g),true);
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
test('Bounty Writ pays only one Contract reward; automatic Elite reagent stays separate',()=>{
 const env=chosen(7780,'bounty_writ'),{a,g,d,card}=env;
 complete(env,'bounty_writ');
 const before={essence:a.state().crafting.essence,fragments:a.state().fragments,cores:a.state().crafting.cores[card.family],gold:a.state().gold};
 const payout=K.settle(g,a.state(),a.results());
 assert.equal(payout.id,'bounty_writ');
 assert(['gold','essence','blueprint'].includes(payout.kind));
 assert.equal(a.state().fragments,before.fragments);
 assert.equal(a.state().crafting.cores[card.family],before.cores);
 if(payout.kind==='blueprint')assert(C.unlocked(a.state().crafting,payout.recipeId));
 if(payout.kind==='essence')assert.equal(a.state().crafting.essence-before.essence,payout.essence);
 if(payout.kind==='gold')assert.equal(a.state().gold-before.gold,payout.gold);
 assert.equal(K.validate(g),true);
 const snapshot=clone(a.state());
 assert.equal(K.settle(g,a.state(),a.results()),null);
 assert.deepEqual(clone(a.state()),snapshot);
 assert.equal(canonicalReplay(g).completedObjectives[0],'bounty_writ');
});
function canonicalReplay(g){
 const {foundationState:s,foundationManifest:manifest,realm}=g.dungeon;
 return F.replayDecisions(manifest,realm,s.decisions.map(({seq,...action})=>action));
}
test('Every accepted Contract pays one validated receipt for its prize kind',()=>{
 for(const id of K.CATALOG.map(x=>x.id)){
  const env=chosen(7840,id),{a,g,d,card}=env,prize=d.stage72RewardPlan.rewards[id];
  complete(env,id);assert(K.progress(g).done);assert(K.validate(g));
  const before=clone(a.state()),paid=K.settle(g,a.state(),a.results());
  assert(paid);
  const kind=prize.kind==='blueprint_chance'?(K.blueprintChance(d.foundationManifest.seed,card,id,prize)?'blueprint':'essence'):prize.kind;
  assert.equal(paid.kind,kind);
  if(kind==='blueprint')assert(C.unlocked(a.state().crafting,paid.recipeId));
  if(kind==='essence')assert.equal(a.state().crafting.essence-before.crafting.essence,paid.essence);
  if(kind==='gold')assert.equal(a.state().gold-before.gold,paid.gold);
  if(kind==='fragments')assert.equal(a.state().fragments-before.fragments,paid.fragments);
  if(kind==='reagent')assert.equal(a.state().crafting.cores[card.family]-before.crafting.cores[card.family],paid.amount);
  if(kind==='potion')assert.equal((a.state().consumables[paid.potion]||0)-(before.consumables?.[paid.potion]||0),paid.amount);
  assert.equal(K.inspect(g).status,'completed');assert.equal(K.inspect(g).paid.kind,paid.kind);
  assert.equal(K.settle(g,a.state(),a.results()),null);assert(K.validate(g));
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
 const copy=clone(g);copy.dungeon.stage7RewardPaid.kind=copy.dungeon.stage7RewardPaid.kind==='blueprint'?'essence':'blueprint';
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

test('Blueprint chance matches Realm affinity and difficulty and has exclusive fallback',()=>{
 for(const risk of [0,1,2]){
  const {d,card}=fresh(9941+risk,risk),offer=K.plan(d.foundationManifest.seed,card,[]),prize=offer.rewards[offer.ids[0]];
  assert.equal(prize.kind,'blueprint_chance');
  assert.equal(prize.chance,[.35,.45,.55][risk]);
  assert(prize.fallbackEssence>0);
  const recipe=C.RECIPES.find(r=>r.id===prize.recipeId);
  assert(recipe);assert.equal(recipe.family,card.family);assert.equal(recipe.rarity,risk===2?'Epic':'Rare');
  assert.match(K.label(prize),/chance/);
 }
});
test('No duplicate Blueprints are offered and exhausted collections yield simple rewards',()=>{
 const env=fresh(9518,2),{d,card}=env,seed=d.foundationManifest.seed;
 const all=C.RECIPES.filter(r=>r.family===card.family&&r.rarity!=='Uncommon').map(r=>r.id);
 const initial=K.plan(seed,card,[]);
 assert.equal(initial.rewards[initial.ids[0]].kind,'blueprint_chance');
 const next=K.plan(seed,card,[initial.rewards[initial.ids[0]].recipeId]);
 assert.equal(next.rewards[next.ids[0]].kind,'blueprint_chance');
 assert.notEqual(next.rewards[next.ids[0]].recipeId,initial.rewards[initial.ids[0]].recipeId);
 const finished=K.plan(seed,card,all);
 assert(finished.ids.every(id=>finished.rewards[id].kind!=='blueprint_chance'));
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
test('A winning Blueprint chance cannot duplicate a Blueprint already learned before settlement',()=>{
 let env;
 for(let seed=8100;seed<8350;seed++){
  const candidate=fresh(seed),offer=candidate.c.offerContracts(),id=offer.ids[0],prize=offer.rewards[id];
  if(prize.kind!=='blueprint_chance'||!K.blueprintChance(candidate.d.foundationManifest.seed,candidate.card,id,prize))continue;
  candidate.c.chooseContract(id);env={...candidate,id,prize};break;
 }
 assert(env);
 complete(env,env.id);
 const {a,g,d,prize}=env;
 a.state().crafting=C.discover(a.state().crafting,prize.recipeId);
 const original=clone(a.state().crafting);
 assert.equal(K.settle(g,a.state(),a.results()),null);
 assert.equal(d.stage7RewardPaid,undefined);
 assert.deepEqual(clone(a.state().crafting),original);
});
