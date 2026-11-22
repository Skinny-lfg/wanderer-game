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
function chosen(seed=7720,id='marked_chambers'){
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
 }else if(id==='marked_chambers'){
  // Real-room completion evidence for both deterministic targets, not scouting.
  const targets=d.stage72RewardPlan.markedRooms;
  assert.equal(targets.length,2);
  for(const node of targets){d.cleared.push(node);d.visited.push(node);g.history.push({node,event:null,boss:false,elite:false});}
 }else if(id==='purification'){
  d.foundationState=F.applyDecision(d.foundationState,{type:'prepare_boss',source:'reliquary'},d.foundationManifest);
  d.disabledBossModifierId=d.foundationState.bossModifierIds[0];
 }else if(id==='oath_of_defiance'){
  const boss=card.nodes.length-1;
  d.cleared.push(boss);d.visited.push(boss);g.history.push({node:boss,boss:true,event:null});
  g.stage='finished';
 }else if(id==='monster_hunt'||id==='skirmish_clear'){
  const normal=card.nodes.map((node,i)=>({node,i})).filter(x=>x.node.kind==='combat'&&K.reachable(card,x.i)<=card.stepLimit);
  const required=id==='monster_hunt'?[6,8,10][card.risk]:3;
  let count=0;
  for(const {node,i} of normal){
   d.cleared.push(i);d.visited.push(i);
   g.history.push({node:i,boss:false,elite:false,event:null,monstersDefeated:node.count});
   count+=id==='monster_hunt'?node.count:1;
   if(count>=required)break;
  }
  assert(count>=required);
 }else throw Error('Unknown synthetic completion');
}
test('Stage 7.7 offers six comprehensible Contracts and exclusive guaranteed reward types',()=>{
 assert.deepEqual(K.CATALOG.map(c=>c.id),['bounty_writ','purification','oath_of_defiance','monster_hunt','skirmish_clear','marked_chambers']);
 const kinds=new Set();
 for(const entry of K.CATALOG)for(let risk=0;risk<=2;risk++)for(let seed=1;seed<=20;seed++){
  const prize=K.reward(entry.id,risk,'blood',seed,'test');
  kinds.add(prize.kind);assert(K.DESCRIPTIONS[entry.id]?.objective);
  assert.notEqual(prize.kind,'blueprint_chance');
 }
 assert.deepEqual([...kinds].sort(),['essence','fragments','gold','potion','reagent']);
 const env=fresh(7111,2),seed=env.d.foundationManifest.seed,p=K.plan(seed,env.card,[]);
 assert.equal(p.ids.length,2);assert.deepEqual(p,K.plan(seed,env.card,[]));
 assert(p.ids.every(id=>['gold','essence','fragments','reagent','potion','blueprint'].includes(p.rewards[id].kind)));
 assert(p.ids.every(id=>p.rewards[id].fallback===undefined&&p.rewards[id].chance===undefined));
 assert.throws(()=>K.reward('fake',1),/Invalid/);
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
test('Marked Chambers are specific separated native combat rooms; visiting/scouting never completes them',()=>{
 const env=chosen(7720,'marked_chambers'),{g,d,card}=env,targets=d.stage72RewardPlan.markedRooms;
 assert.equal(targets.length,2);
 assert(targets.every(i=>card.nodes[i].kind==='combat'));
 assert.notEqual(K.sector(card,targets[0]),K.sector(card,targets[1]));
 assert.deepEqual(K.progress(g),{current:0,target:2,done:false});
 d.scouted.push(...targets);d.visited.push(...targets);
 assert.equal(K.progress(g).current,0);
 d.cleared.push(targets[0]);assert.equal(K.progress(g).current,0,'cleared flags without native history are insufficient');
 g.history.push({node:targets[0],event:null,boss:false,elite:false});
 assert.deepEqual(K.progress(g),{current:1,target:2,done:false});
 d.cleared.push(targets[1]);g.history.push({node:targets[1],event:null,boss:false,elite:false});
 assert.deepEqual(K.progress(g),{current:2,target:2,done:true});
 assert(K.validate(g));
});
test('Bounty Writ pays only one Contract reward; automatic Elite reagent stays separate',()=>{
 const env=chosen(7780,'bounty_writ'),{a,g,d,card}=env;
 complete(env,'bounty_writ');
 const before={essence:a.state().crafting.essence,fragments:a.state().fragments,cores:a.state().crafting.cores[card.family],gold:a.state().gold};
 const payout=K.settle(g,a.state(),a.results(),'extracted');
 assert.equal(payout.id,'bounty_writ');
 assert(['gold','essence','fragments','reagent','potion','blueprint'].includes(payout.kind));
 if(payout.kind!=='fragments')assert.equal(a.state().fragments,before.fragments);
 if(payout.kind!=='reagent')assert.equal(a.state().crafting.cores[card.family],before.cores);
 if(payout.kind==='blueprint')assert(C.unlocked(a.state().crafting,payout.recipeId));
 if(payout.kind==='essence')assert.equal(a.state().crafting.essence-before.essence,payout.essence);
 if(payout.kind==='gold')assert.equal(a.state().gold-before.gold,payout.gold);
 assert.equal(K.validate(g),true);
 const snapshot=clone(a.state());
 assert.equal(K.settle(g,a.state(),a.results(),'extracted'),null);
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
  const before=clone(a.state()),paid=K.settle(g,a.state(),a.results(),g.stage==='finished'?'victory':'extracted');
  assert(paid);
  const kind=prize.kind;
  assert.equal(paid.kind,kind);
  if(kind==='blueprint')assert(C.unlocked(a.state().crafting,paid.recipeId));
  if(kind==='essence')assert.equal(a.state().crafting.essence-before.crafting.essence,paid.essence);
  if(kind==='gold')assert.equal(a.state().gold-before.gold,paid.gold);
  if(kind==='fragments')assert.equal(a.state().fragments-before.fragments,paid.fragments);
  if(kind==='reagent')assert.equal(a.state().crafting.cores[card.family]-before.crafting.cores[card.family],paid.amount);
  if(kind==='potion')assert.equal((a.state().consumables[paid.potion]||0)-(before.consumables?.[paid.potion]||0),paid.amount);
  assert.equal(K.inspect(g).status,'completed');assert.equal(K.inspect(g).paid.kind,paid.kind);
  assert.equal(K.settle(g,a.state(),a.results(),'extracted'),null);assert(K.validate(g));
 }
});
test('Stage 7 Oath of Defiance fails if any boss seal was disabled',()=>{
 const env=chosen(7960,'oath_of_defiance'),{a,g,d,card}=env;
 const boss=card.nodes.length-1;g.stage='finished';d.cleared.push(boss);d.visited.push(boss);
 assert(K.progress(g).done);
 d.foundationState=F.applyDecision(d.foundationState,{type:'prepare_boss',source:'reliquary'},d.foundationManifest);
 d.disabledBossModifierId=d.foundationState.bossModifierIds[0];
 assert.equal(K.progress(g).done,false);
 assert.equal(K.settle(g,a.state(),a.results(),'extracted'),null);
 assert.equal(K.inspect(g,'victory').status,'failed');
});
test('Stage 7 incomplete, abandoned and ignored contracts grant no extra resources',()=>{
 const env=chosen(8001,'purification'),{a,g}=env;
 const wallet=clone({essence:a.state().crafting.essence,fragments:a.state().fragments});
 assert.equal(K.settle(g,a.state(),a.results(),'extracted'),null);
 assert.equal(K.inspect(g,'extracted').status,'failed');
 assert.equal(K.inspect(g,'defeat').status,'failed');
 assert.equal(K.inspect(g,'abandoned').status,'failed');
 assert.deepEqual({essence:a.state().crafting.essence,fragments:a.state().fragments},wallet);
 const other=fresh(8002);other.c.offerContracts();other.c.chooseContract(null);
 assert.equal(K.inspect(other.g,'extracted').status,'ignored');
 assert.equal(K.settle(other.g,other.a.state(),other.a.results()),null);
});
test('Stage 7 cannot be paid on a forged completion or a duplicated reward record',()=>{
 const env=chosen(8003,'marked_chambers'),{c,g,d,a}=env;
 const wrong=clone(g);
 wrong.dungeon.stage7RewardPaid={id:'marked_chambers',kind:'essence',essence:100};
 assert.throws(()=>c.restore(wrong),/Invalid/);
 complete(env,'marked_chambers');
 K.settle(g,a.state(),a.results(),'extracted');
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

test('Blueprint is a rare standalone offer which becomes a guaranteed prize on safe exit',()=>{
 for(const risk of [0,1,2]){
  const {card}=fresh(9941+risk,risk);let found=null;
  for(let seed=1;seed<1200;seed++){
   const plan=K.plan(seed,card,[]),id=plan.ids.find(i=>plan.rewards[i].kind==='blueprint');
   if(id){found={id,prize:plan.rewards[id],seed,plan};break;}
  }
  assert(found,'no Blueprint offer found at risk '+risk);
  assert.equal(found.prize.kind,'blueprint');
  assert.equal(found.plan.ids.filter(i=>found.plan.rewards[i].kind==='blueprint').length,1);
  assert(K.blueprintOffer(found.seed,card,found.id));
  assert.equal(K.label(found.prize).includes('Guaranteed'),true);
  assert(!('fallback'in found.prize)&&!('chance'in found.prize));
  const recipe=C.RECIPES.find(r=>r.id===found.prize.recipeId);
  assert(recipe);assert.equal(recipe.family,card.family);
  assert.equal(recipe.rarity,risk===2?'Epic':'Rare');
 }
});
test('Exhausted Blueprint collection forces ordinary standalone rewards and no duplicate recipes',()=>{
 const {card}=fresh(9518,2),all=C.RECIPES.filter(r=>r.family===card.family&&r.rarity!=='Uncommon').map(r=>r.id);
 for(let seed=9518;seed<9550;seed++){
  const p=K.plan(seed,card,all);
  assert(p.ids.every(id=>p.rewards[id].kind!=='blueprint'));
  const p2=K.plan(seed,card,[]);assert(p2.ids.filter(id=>p2.rewards[id].kind==='blueprint').length<=1);
 }
 assert.throws(()=>K.plan(9518,card,['unknown']),/Invalid/);
});
test('Stage 7.2 canonical reward plan cannot be replaced, increased or changed in a checkpoint',()=>{
 const env=chosen(9813,'marked_chambers'),{c,g,d}=env;
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
test('A selected guaranteed Blueprint cannot be paid twice or granted if already learned before settlement',()=>{
 let env;
 for(let seed=8100;seed<8600;seed++){
  const candidate=fresh(seed),offer=candidate.c.offerContracts(),id=offer.ids.find(i=>offer.rewards[i].kind==='blueprint');
  if(!id)continue;
  candidate.c.chooseContract(id);env={...candidate,id,prize:offer.rewards[id]};break;
 }
 assert(env,'no rare Blueprint offer discovered across natural seeded maps');
 complete(env,env.id);
 const {a,g,d,prize}=env;
 a.state().crafting=C.discover(a.state().crafting,prize.recipeId);
 const original=clone(a.state().crafting);
 assert.equal(K.settle(g,a.state(),a.results(),'extracted'),null);
 assert.equal(d.stage7RewardPaid,undefined);
 assert.deepEqual(clone(a.state().crafting),original);
});
test('only current Blueprints and canonical plans validate after clean-sheet reset',()=>{
 const env=fresh(7111,2),{c,g,d,card}=env;
 assert.throws(()=>K.plan(d.foundationManifest.seed,card,['blue_offdagger']),/Invalid/);
 const now=K.plan(d.foundationManifest.seed,card,[]);d.contractOffer=clone(now);
 assert(K.validateOffer(g));const selected=now.ids[0];assert(c.chooseContract(selected));assert(K.validate(g));
 d.stage72RewardPlan.rewards[selected]={kind:'essence',essence:9999};assert(!K.validate(g));
});

test('Monster Hunt only counts actual enemies killed in completed combat rooms',()=>{
 const env=chosen(11300,'monster_hunt'),{g,d,card}=env;
 const combat=card.nodes.map((node,i)=>({node,i})).filter(x=>x.node.kind==='combat'&&K.reachable(card,x.i)<=card.stepLimit);
 assert(combat.length);
 const first=combat[0];
 d.visited.push(first.i);
 assert.equal(K.progress(g).current,0,'scouting must never count as killing');
 d.cleared.push(first.i);
 g.history.push({node:first.i,event:null,elite:false,boss:false,mobCount:32});
 assert.equal(K.progress(g).current,0,'planned enemy counts cannot grant the kill objective');
 g.history.at(-1).monstersDefeated=first.node.count;
 assert.equal(K.progress(g).current,Math.min([6,8,10][card.risk],first.node.count));
 complete({g,d,card},'monster_hunt');
 assert.equal(K.progress(g).done,true);
});
test('Skirmish and marked chamber contracts require actual completed rooms',()=>{
 for(const id of ['skirmish_clear','marked_chambers']){
  const env=chosen(11500,id),{g,d,card}=env;
  d.scouted.push(1,2);
  assert.equal(K.progress(g).current,0);
  complete(env,id);
  assert.equal(K.progress(g).done,true);
  assert.equal(K.validate(g),true);
 }
});
test('Contract completed before extraction grants nothing on death or abandonment',()=>{
 for(const id of ['bounty_writ','monster_hunt','skirmish_clear','marked_chambers']){
  const env=chosen(11600,id),{g,a}=env;
  complete(env,id);
  const prior=clone(a.state());
  assert.equal(K.progress(g).done,true);
  assert.equal(K.inspect(g).status,'ready');
  assert.equal(K.settle(g,a.state(),a.results()),null,'missing safe outcome must not pay');
  assert.equal(K.settle(g,a.state(),a.results(),'defeat'),null);
  assert.equal(K.settle(g,a.state(),a.results(),'abandoned'),null);
  assert.equal(K.settle(g,a.state(),a.results(),'victory'),null,'ordinary completed rooms are not a won final Boss');
  assert.deepEqual(clone(a.state()),prior);
  assert.equal(g.dungeon.stage7RewardPaid,undefined);
  assert.equal(K.inspect(g,'defeat').status,'failed');
  const received=K.settle(g,a.state(),a.results(),'extracted');
  assert(received,'alive extraction must grant exactly one contract prize');
  assert.equal(K.settle(g,a.state(),a.results(),'extracted'),null);
 }
});

test('Marked Chambers targets are individually reachable on real map and jointly fit conservative step budget',()=>{
 let eligibleCount=0;
 for(const risk of [0,1,2])for(let seed=9201;seed<9210;seed++){
  const {card,d}=fresh(seed,risk),eligible=K.eligible(card,'marked_chambers');
  const targets=K.markedRooms(d.foundationManifest.seed,card);
  if(!eligible){assert.deepEqual(targets,[]);continue;}
  eligibleCount++;
  assert.equal(targets.length,2);
  assert.deepEqual(targets,K.markedRooms(d.foundationManifest.seed,card));
  assert(targets.every(i=>i>=5&&i<=16&&card.nodes[i].kind==='combat'));
  assert.notEqual(K.sector(card,targets[0]),K.sector(card,targets[1]));
  const [a,b]=targets.map(i=>K.reachable(card,i));
  assert(Number.isFinite(a)&&Number.isFinite(b));
  assert(a+Math.min(2,a)+b<=card.stepLimit-1,
   'two marked branches need ' +(a+Math.min(2,a)+b)+' steps for risk '+risk);
 }
 assert(eligibleCount>=12,'marked contract should be viable on a meaningful fraction of generated maps');
});
test('A guaranteed Blueprint is actually awarded as the single complete Contract payout',()=>{
 let found;
 for(let seed=11100;seed<11320;seed++){
  const env=fresh(seed),offer=env.c.offerContracts(),id=offer.ids.find(i=>offer.rewards[i].kind==='blueprint');
  if(!id)continue;
  env.c.chooseContract(id);found={...env,id,recipeId:offer.rewards[id].recipeId};break;
 }
 assert(found,'expected one rare guaranteed Blueprint among real random offers');
 complete(found,found.id);
 const before=clone(found.a.state());
 assert.equal(K.settle(found.g,found.a.state(),found.a.results(),'defeat'),null);
 const paid=K.settle(found.g,found.a.state(),found.a.results(),found.g.stage==='finished'?'victory':'extracted');
 assert.equal(paid.kind,'blueprint');assert.equal(paid.recipeId,found.recipeId);
 assert(C.unlocked(found.a.state().crafting,paid.recipeId));
 assert.equal(found.a.state().gold,before.gold);
 assert.equal(found.a.state().fragments,before.fragments);
 assert.equal(found.a.state().crafting.essence,before.crafting.essence);
 assert.equal(K.settle(found.g,found.a.state(),found.a.results(),'extracted'),null);
 assert(K.validate(found.g));
});
test('Standalone reward pool uses low blueprint-offer rates and no legacy secondary rolls',()=>{
 assert.deepEqual(K.BLUEPRINT_OFFER_RATE,[.05,.07,.10]);
 const {card}=fresh(9790,1);
 let blueprintOffers=0;
 for(let seed=1;seed<=450;seed++){
  const x=K.plan(seed,card,[]);
  assert(x.ids.every(id=>!['blueprint_chance','blueprint_offer'].includes(x.rewards[id].kind)));
  assert(x.ids.every(id=>!('fallback' in x.rewards[id])&&!('chance' in x.rewards[id])));
  blueprintOffers+=x.ids.filter(id=>x.rewards[id].kind==='blueprint').length;
  assert(x.ids.filter(id=>x.rewards[id].kind==='blueprint').length<=1);
 }
 assert(blueprintOffers>0&&blueprintOffers<95,'Blueprint rewards must remain uncommon on seeded maps');
});
test('Map and offers explicitly communicate real target rooms and no hidden Blueprint fallback',()=>{
 const fs=require('node:fs');
 for(const file of ['index.html','docs/index.html']){
  const html=fs.readFileSync(file,'utf8');
  assert(html.includes('data-contract-target='));
  assert(html.includes('contractTargets.includes(i)'));
  assert(html.includes('🎯 Contract target'));
  assert(html.includes('rare Blueprint offer is guaranteed'));
  assert(!html.includes('If the Blueprint roll fails'));
 }
});
