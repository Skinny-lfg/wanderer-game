'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-map-intelligence.js');
require('../online/v013-expedition-boons.js');
const I=globalThis.WandererV013MapIntelligence,B=globalThis.WandererV013ExpeditionBoons;
const create=require('./v012-economy-harness.cjs'),clone=x=>JSON.parse(JSON.stringify(x));
function fresh(seed=7300,risk=0){
 const a=create(seed,undefined,{}, {skipPersistence:true});a.start(1,true);
 const c=a.controller(),card=c.state.dungeon.cards[risk];c.chooseRealm(card.id);
 return {a,c,card,d:c.state.dungeon,g:c.state};
}
function directShrine(seed=7300){
 for(let i=0;i<36;i++){const env=fresh(seed+i);if(env.card.boonShrines[0]===4)return env;}
 throw Error('No direct Shrine map');
}
function shortest(card,to){
 const paths=[[0]],seen=new Set([0]),d={visited:[0],discoveredSecrets:[]};
 for(const path of paths){
  const from=path.at(-1);if(from===to)return path;
  for(const next of I.neighbors(card,d,from))if(!seen.has(next)){seen.add(next);paths.push([...path,next]);}
 }
 return null;
}
test('Stage 7.3 two hidden deterministic reachable Shrines per risk card, without topology changes',()=>{
 for(let seed=7300;seed<7316;seed++){
  const {d}=fresh(seed);
  for(const card of d.cards){
   const [first,second]=card.boonShrines;
   assert.equal(card.boonShrines.length,2);
   assert(first>=4&&first<=8);
   assert(second>=9&&second<=16);
   assert.notEqual(first,second);
   assert(B.validateTopology(card,d.foundationManifest.seed));
   for(const room of card.boonShrines){
    const n=card.nodes[room],route=shortest(card,room);
    assert.equal(n.kind,'shrine');assert.equal(n.event,null);assert.equal(n.traitId,undefined);
    assert(route&&route.length-1<=card.stepLimit);
    assert.notEqual(room,card.objective);assert.notEqual(room,card.reliquaryRoom);
   }
  }
 }
});
test('Stage 7.3 no free Boon or resources by discovering a Shrine; travel waits for a decision',()=>{
 const {a,c,card,d}=directShrine(7340);
 assert.equal(c.offerBoons(['blood']),null);
 const before=clone({gold:a.state().gold,crafting:a.state().crafting,talents:a.state().automaticTalents});
 assert(c.visitRoom(card.boonShrines[0],['blood']));
 assert.equal(d.boonOffer?.ids.length,3);
 assert.deepEqual(clone({gold:a.state().gold,crafting:a.state().crafting,talents:a.state().automaticTalents}),before);
 assert.equal(d.foundationState.boonIds.length,0);
 assert.equal(c.visitRoom(1),false);
 assert.equal(B.validateOffer(d,c.state),true);
});
test('Stage 7.3 Shrine skip cannot be reclaimed and restores from the replayable ledger',()=>{
 const {c,card,d,g}=directShrine(7380);
 assert(c.visitRoom(card.boonShrines[0],['fury']));
 assert.deepEqual(clone(c.restore(clone(g)).dungeon.boonOffer),clone(d.boonOffer));
 assert.equal(c.chooseBoon(null),null);assert.equal(c.state.dungeon.foundationState.boonIds.length,0);
 const last=c.state.dungeon.foundationState.decisions.at(-1);
 assert.equal(last.type,'skip_boon');assert.equal(last.room,card.boonShrines[0]);
 assert.equal(c.offerBoons(['fury']),null);
 assert(c.visitRoom(card.boonShrines[0],['fury']));assert.equal(c.state.dungeon.boonOffer,undefined);
 assert(B.validateOffer(c.state.dungeon,g));assert.equal(c.restore(clone(g)).dungeon.foundationState.decisions.at(-1).type,'skip_boon');
});
test('Stage 7.3 forged room placement, claimed Boon or unresolved offer cannot be restored',()=>{
 const {c,card,d,g}=directShrine(7410);
 assert(c.visitRoom(card.boonShrines[0],['arcane']));
 const saved=clone(g);
 const forged=clone(saved);forged.dungeon.boonOffer.room=card.boonShrines[1];
 assert.throws(()=>c.restore(forged),/Invalid/);
 const fake=clone(saved);fake.dungeon.boonOffer.ids[0]='bogus';
 assert.throws(()=>c.restore(fake),/Invalid/);
 c.chooseBoon(d.boonOffer.ids[0]);
 const chosen=clone(g),wrong=clone(chosen);
 wrong.dungeon.foundationState.decisions.find(x=>x.type==='choose_boon').room=card.boonShrines[1];
 assert.throws(()=>c.restore(wrong),/Invalid/);
 const topology=clone(chosen);topology.dungeon.cards[0].boonShrines.reverse();
 assert.throws(()=>c.restore(topology),/Invalid/);
 assert.deepEqual(clone(g),chosen);
});
test('Stage 7.3 abandoning at a Shrine records skip, then validates failed checkpoint',()=>{
 const {c,card,d,g}=directShrine(7440);
 assert(c.visitRoom(card.boonShrines[0],[]));
 c.abandon();
 assert.equal(g.stage,'failed');assert.equal(d.boonOffer,undefined);
 assert.equal(B.resolutions(d.foundationState).at(-1).type,'skip_boon');
 assert(B.validateOffer(d,g));assert.equal(c.restore(clone(g)).stage,'failed');
});
