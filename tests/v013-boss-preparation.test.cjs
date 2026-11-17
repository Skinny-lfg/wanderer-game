'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../combat/v013-expedition-foundation.js');
const F=globalThis.WandererV013ExpeditionFoundation;
require('../online/v013-boss-preparation.js');
const P=globalThis.WandererV013BossPreparation;
require('../online/v013-map-intelligence.js');
const I=globalThis.WandererV013MapIntelligence;
require('../online/v013-encounter-traits.js');
require('../online/v012-expedition-controller.js');
const E=globalThis.WandererV012Expedition;
const themes=Object.entries(E.REALMS).map(([id,[family,name]])=>({id,family,name}));
const seeded=seed=>{let x=seed>>>0;return()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);};
function start(seed=1){const e=E.create(themes,seeded(seed));e.start(1,{freeBuild:true,dungeon:true});return e;}

test('10k seeds produce one optional Reliquary in each of 30k maps with unchanged rooms and steps',()=>{
 for(let seed=0;seed<10000;seed++){
  const e=start(seed),cards=e.state.dungeon.cards;
  assert.deepEqual(cards.map(c=>c.nodes.length),[18,20,22]);
  assert.deepEqual(cards.map(c=>c.stepLimit),[14,13,12]);
  for(const card of cards){
   const targets=card.nodes.map((n,i)=>n.event==='forgotten_reliquary'?i:-1).filter(i=>i>=0);
   assert.deepEqual(targets,[card.reliquaryRoom]);
   assert(card.reliquaryRoom>=5&&card.reliquaryRoom<=12&&card.reliquaryRoom!==card.clueRoom);
   assert.equal(card.nodes[card.reliquaryRoom].kind,'event');
   const marked=card.nodes.filter(n=>n.traitId);assert.equal(marked.length,card.risk+1);
   assert(marked.every(n=>n.kind==='combat'));
   if(card.risk===2)assert(card.nodes.some(n=>n.kind==='combat'&&n.count>=18),'Brutal horde must not be replaced');
   const q=[[0]],seen=new Set([0]);let path=null;
   for(const trial of q){const last=trial.at(-1);if(last===card.reliquaryRoom){path=trial;break;}
    for(const next of I.neighbors(card,{visited:[],discoveredSecrets:[]},last))if(!seen.has(next)){seen.add(next);q.push([...trial,next]);}
   }
   assert(path,'reliquary unreachable');assert(path.length-1<=card.stepLimit,'reliquary too distant');
  }
 }
});
test('same seed creates identical Reliquary locations and leaves existing map navigation untouched',()=>{
 for(let i=0;i<100;i++){
  const a=start(i),b=start(i);assert.deepEqual(a.state.dungeon.cards,b.state.dungeon.cards);
  for(const card of a.state.dungeon.cards){assert.equal(card.nodes[0].kind,'entrance');assert.equal(card.nodes.at(-1).kind,'boss');}
 }
});
test('Elite preparation applies once only and preserves original extraction contract',()=>{
 const e=start(111),c=e.state.dungeon.cards[0];e.chooseRealm(c.id);
 let g=e.state;g.selected={node:c.objective,elite:true,boss:false};
 assert.equal(P.markElite(g),true);assert.equal(P.markElite(g),false);
 assert.equal(g.dungeon.foundationState.bossPreparation.markedElite,true);
 assert.equal(P.bossAttackFactor(g),.9);assert.equal(P.escortCount(g,0),0);
 assert.equal(g.dungeon.foundationState.decisions.filter(x=>x.source==='markedElite').length,1);
 assert.equal(g.dungeon.contractPaid,undefined);
});
test('Dangerous and Brutal remove one total boss guard without altering manifest',()=>{
 for(const risk of [1,2]){
  const e=start(177+risk),c=e.state.dungeon.cards[risk];e.chooseRealm(c.id);
  const g=e.state,manifest=JSON.stringify(g.dungeon.foundationManifest);
  g.selected={node:c.objective,elite:true,boss:false};assert.equal(P.markElite(g),true);
  assert.equal(P.bossAttackFactor(g),1);assert.equal(P.escortCount(g,risk),risk-1);
  assert.equal(P.escortCount(g,risk+1),risk);
  assert.equal(JSON.stringify(g.dungeon.foundationManifest),manifest);
 }
});
test('Reliquary disables only the first known boss modifier; base manifest remains unchanged',()=>{
 const e=start(351),c=e.state.dungeon.cards[2];e.chooseRealm(c.id);
 const g=e.state,first=g.dungeon.foundationState.bossModifierIds[0],original=JSON.stringify(g.dungeon.foundationManifest);
 g.selected={node:c.reliquaryRoom,event:'forgotten_reliquary'};
 assert.equal(P.reliquaryCanDisrupt(g),true);
 assert.equal(P.disrupt(g),first);
 assert.deepEqual(P.effectiveModifiers(g),g.dungeon.foundationState.bossModifierIds.slice(1));
 assert.equal(P.disrupt(g),null);
 assert.equal(JSON.stringify(g.dungeon.foundationManifest),original);
 assert.equal(F.validateExpeditionState(g.dungeon.foundationState,g.dungeon.foundationManifest),true);
 assert.equal(g.dungeon.foundationState.decisions.filter(x=>x.source==='reliquary').length,1);
});
test('Oracle reveals one additional property only and never reveals unrevealed IDs to the UI before combat',()=>{
 const e=start(752),c=e.state.dungeon.cards[2];e.chooseRealm(c.id);
 const g=e.state,ids=g.dungeon.foundationState.bossModifierIds;
 assert.deepEqual(P.knownModifierIds(g,c.id),ids.slice(0,1));
 const first=P.revealBoss(g);assert.equal(first,ids[1]);
 assert.deepEqual(P.knownModifierIds(g,c.id),ids.slice(0,2));
 assert.equal(P.status(g).hiddenCount,1);
 assert.equal(F.validateExpeditionState(g.dungeon.foundationState,g.dungeon.foundationManifest),true);
 assert.equal(P.revealBoss(g),ids[2]);assert.equal(P.revealBoss(g),null);
 assert.deepEqual(P.knownModifierIds(g,c.id),ids);
 assert.equal(g.dungeon.foundationState.decisions.filter(x=>x.type==='reveal_boss').length,2);
});
test('Stage 0 serializable journal replays elite, Reliquary and Oracle choices without mutating original plan',()=>{
 const e=start(55),c=e.state.dungeon.cards[2];e.chooseRealm(c.id);let g=e.state;
 const original=JSON.stringify(g.dungeon.foundationManifest);
 g.selected={node:c.objective,elite:true,boss:false};P.markElite(g);
 g.selected={node:c.reliquaryRoom,event:'forgotten_reliquary'};P.disrupt(g);P.revealBoss(g);
 const s=g.dungeon.foundationState,replay=F.replayDecisions(g.dungeon.foundationManifest,c.id,s.decisions);
 assert.deepEqual(replay,s);
 assert.equal(JSON.stringify(g.dungeon.foundationManifest),original);
});
