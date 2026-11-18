'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/v013-expedition-foundation.js');
require('../online/v013-expedition-boons.js');
const F=globalThis.WandererV013ExpeditionFoundation,B=globalThis.WandererV013ExpeditionBoons;
const create=require('./v012-economy-harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function fresh(seed=6301){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.start(1,true);
 const c=a.controller(),card=c.state.dungeon.cards[0];
 c.chooseRealm(card.id);
 return {a,c,card};
}
test('Stage 6: six Boons exactly match approved lore and numeric tradeoffs',()=>{
 assert.deepEqual(B.CATALOG.map(x=>x.id),['blood_tribute','predators_focus','bastion_oath','aetherbound_pact','rotbound_echo','wayfarers_bargain']);
 for(const boon of B.CATALOG)assert(B.GUIDE[boon.id]?.benefit&&B.GUIDE[boon.id]?.cost);
 assert.deepEqual(B.stats({maxhp:1000,spellPower:100},['aetherbound_pact','wayfarers_bargain']),{maxhp:900,spellPower:118});
 assert.equal(B.stepsAdded('wayfarers_bargain'),1);
 const r={boonIds:['blood_tribute','predators_focus']};
 assert(Math.abs(B.factor(r,false)-1.035)<1e-9);
 assert(Math.abs(B.factor(r,true)-.81)<1e-9);
 assert.equal(B.dotFactor(r),1.2);
 assert.equal(B.takenFactor({boonIds:['bastion_oath']}),.88);
 assert.equal(B.speedFactor({boonIds:['bastion_oath']}),.90);
 assert.equal(B.costFactor({boonIds:['aetherbound_pact']}),1.20);
 assert.equal(B.factor({boonIds:['rotbound_echo']}),.9);
 assert.equal(B.factor({boonIds:[]}),1);
});
test('Stage 6: deterministic three-card Boon offers always include build synergy when available',()=>{
 for(const family of F.AFFINITIES)for(let seed=0;seed<80;seed++){
  const ids=B.offer(seed,'forge',0,[family],[]);
  assert.equal(ids.length,3);assert.equal(new Set(ids).size,3);
  assert.deepEqual(ids,B.offer(seed,'forge',0,[family],[]));
  assert(ids.some(id=>B.get(id).families.includes(family)&&id!=='wayfarers_bargain'),family);
 }
 const first=B.offer(12,'forge',0,['magic'],[]);
 assert.equal(first[0],'aetherbound_pact');
 const second=B.offer(12,'forge',1,['magic'],['aetherbound_pact']);
 assert.equal(second.length,3);assert(!second.includes('aetherbound_pact'));
 assert.throws(()=>B.offer(12,'forge',2,['magic'],[]),/Invalid/);
 assert.throws(()=>B.offer(12,'forge',1,['magic'],['fake']),/Invalid/);
});
test('Stage 6: offer is checkpoint-safe and blocks room travel until a legal choice',()=>{
 const {c,card}=fresh(6302),d=c.state.dungeon;
 const offered=c.offerBoons(['blood']);assert(offered);assert.equal(offered.round,0);
 assert.equal(B.validateOffer(d),true);
 assert.equal(c.visitRoom(1),false);
 assert.deepEqual(clone(c.restore(clone(c.state)).dungeon.boonOffer),clone(offered));
 const invalid=clone(c.state);invalid.dungeon.boonOffer.ids[0]='forged_boon';
 assert.throws(()=>c.restore(invalid),/Invalid/);
 const id=offered.ids[0];assert.equal(c.chooseBoon(id),id);
 assert.equal(c.state.dungeon.boonOffer,undefined);assert.deepEqual([...c.state.dungeon.foundationState.boonIds],[id]);
 assert.throws(()=>c.chooseBoon(id),/unavailable/);
 assert.equal(c.state.dungeon.foundationState.decisions.at(-1).type,'choose_boon');
 assert.equal(c.restore(clone(c.state)).dungeon.foundationState.boonIds[0],id);
 assert(c.visitRoom(1));assert(c.state.dungeon.steps<card.stepLimit+B.stepsAdded(id));
});
test('Stage 6: Wayfarer grants precisely one step and imposes -10% native Max Health',()=>{
 const {a,c,card}=fresh(6303),d=c.state.dungeon;
 const before=a.stats(),o=c.offerBoons([]);
 assert.equal(o.ids[0],'wayfarers_bargain');
 c.chooseBoon('wayfarers_bargain');
 assert.equal(d.steps,card.stepLimit+1);
 assert.equal(a.stats().maxhp,Math.max(1,Math.round(before.maxhp*.9)));
 assert(c.visitRoom(1));assert(a.enter());
 assert.deepEqual([...a.state().run.boonIds],['wayfarers_bargain']);
 assert.equal(a.state().run.maxhp,Math.max(1,Math.round(before.maxhp*.9)));
});
test('Stage 6: Aetherbound Pact changes native spell stats without modifying permanent gear',()=>{
 const {a,c}=fresh(6304),before=a.baseStats(),gear=JSON.stringify(a.state().equip);
 const offered=c.offerBoons(['magic']);assert.equal(offered.ids[0],'aetherbound_pact');
 c.chooseBoon('aetherbound_pact');
 assert.equal(a.stats().spellPower,Math.round(before.spellPower*1.18));
 assert.equal(JSON.stringify(a.state().equip),gear);
 assert(c.visitRoom(1));assert(a.enter());
 assert.equal(B.costFactor(a.state().run),1.2);
 assert.equal(a.state().run.stats.spellPower,Math.round(before.spellPower*1.18));
});
test('Stage 6: the second offer requires four cleared fights, cannot duplicate, and stops at two',()=>{
 const {c}=fresh(6305),d=c.state.dungeon,first=c.offerBoons(['blood']);
 const selected=first.ids[0];c.chooseBoon(selected);
 assert.equal(c.offerBoons(['blood']),null);
 // This unit fixture advances the milestone ledger only; actual map traversal
 // and combat are validated separately by the browser/native CI integration.
 d.cleared.push(1,2,3,4);d.visited.push(1,2,3,4);
 const offer=c.offerBoons(['blood']);assert.equal(offer.round,1);
 assert.equal(offer.ids.length,3);assert(!offer.ids.includes(selected));
 const other=offer.ids[1];c.chooseBoon(other);
 assert.deepEqual([...d.foundationState.boonIds],[selected,other]);
 assert.equal(c.offerBoons(['blood']),null);
 assert.equal(c.restore(clone(c.state)).dungeon.foundationState.boonIds.length,2);
});
test('Stage 6: Rotbound Echo spreads strongest DoT at 30% once per native encounter',()=>{
 const dead={hp:0,dots:{bleed:[{damage:12,remaining:3}],burn:[{damage:4,remaining:3}]},v012Rot:[{damage:21,remaining:4}]};
 const alive={hp:100,dots:{bleed:[]},v012Rot:[]},reserve={hp:100,dots:{bleed:[]},v012Rot:[]};
 const run={boonIds:['rotbound_echo'],enemies:[dead,alive],groupReserve:[reserve]};
 assert.equal(B.spreadOnDeath(run,dead),2);
 assert.equal(run.boonRotboundTriggers,1);
 assert.equal(alive.v012Rot[0].damage,6);assert.equal(alive.v012Rot[0].remaining,2);
 assert.equal(reserve.v012Rot[0].damage,6);
 assert.equal(B.spreadOnDeath(run,dead),0);
 assert.equal(B.spreadOnDeath({boonIds:[],enemies:[dead,alive]},dead),0);
});
test('Stage 6: invalid Boon ledgers and duplicate picks are rejected without corrupting state',()=>{
 const {c}=fresh(6306),o=c.offerBoons(['aegis']);
 const valid=clone(c.state),invalid=clone(valid);
 invalid.dungeon.foundationState.boonIds=['bastion_oath'];
 assert.throws(()=>c.restore(invalid),/Invalid/);
 assert.deepEqual(clone(c.state),valid);
 c.chooseBoon(o.ids[0]);
 const bad=clone(c.state);bad.dungeon.foundationState.boonIds.push(o.ids[0]);
 assert.throws(()=>c.restore(bad),/Invalid/);
});
