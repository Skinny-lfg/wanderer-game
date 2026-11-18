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
// Shrine 1 can be placed at node 4: direct from the entrance, useful for
// deterministic native tests without manufacturing combat victories.
function directShrine(seed=6302){
 for(let attempt=0;attempt<36;attempt++){
  const env=fresh(seed+attempt);
  if(env.card.boonShrines[0]===4)return env;
 }
 throw Error('No direct Shrine map found');
}
function stageLaterShrine(env,families=['blood']){
 const {c,card}=env,g=c.state,d=g.dungeon,late=card.boonShrines[1];
 // Prepare only the connecting cleared path for unit isolation; travel and
 // the actual Shrine resolution still go through the native controller.
 const chain=[[0]],seen=new Set([0]);
 let path=null;
 for(const row of chain){
  if(row.at(-1)===late){path=row;break;}
  for(const [a,b]of card.edges){
   const k=a===row.at(-1)?b:b===row.at(-1)?a:null;
   if(k===null||seen.has(k)||(a===card.shortcut&&b===a+1))continue;
   seen.add(k);chain.push([...row,k]);
  }
 }
 assert(path&&path.length>2,'late Shrine has a normal route');
 for(const room of path.slice(1,-1)){
  if(!d.cleared.includes(room))d.cleared.push(room);
  if(!d.visited.includes(room))d.visited.push(room);
 }
 d.current=path.at(-2);
 assert(c.visitRoom(late,families),'second Shrine must be enterable');
 assert.equal(d.boonOffer?.room,late);
 return d.boonOffer;
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
test('Stage 7.3 no Boon can be picked before physically discovering a Shrine',()=>{
 const {c,card}=directShrine(6302),d=c.state.dungeon;
 assert.deepEqual(card.boonShrines.length,2);
 assert.equal(c.offerBoons(['blood']),null,'entry no longer offers a Boon');
 assert.throws(()=>c.chooseBoon('blood_tribute'),/unavailable/);
 assert(c.visitRoom(card.boonShrines[0],['blood']));
 assert.equal(d.boonOffer?.room,card.boonShrines[0]);
 assert.equal(d.boonOffer.ids.length,3);
 assert.equal(B.validateOffer(d,c.state),true);
 const saved=clone(c.state);assert.deepEqual(clone(c.restore(saved).dungeon.boonOffer),saved.dungeon.boonOffer);
 const invalid=clone(saved);invalid.dungeon.boonOffer.ids[0]='forged_boon';
 assert.throws(()=>c.restore(invalid),/Invalid/);
 const id=d.boonOffer.ids[0];assert.equal(c.chooseBoon(id),id);
 assert.equal(c.state.dungeon.boonOffer,undefined);
 assert.deepEqual([...d.foundationState.boonIds],[id]);
 assert.throws(()=>c.chooseBoon(id),/unavailable/);
 assert.equal(d.foundationState.decisions.at(-1).type,'choose_boon');
 assert.equal(d.foundationState.decisions.at(-1).room,card.boonShrines[0]);
 assert.equal(c.restore(clone(c.state)).dungeon.foundationState.boonIds[0],id);
});
test('Stage 7.3 Wayfarer grants exactly one step when picked at a Shrine and reduces Health',()=>{
 const {a,c,card}=directShrine(6303),before=a.stats();
 assert(c.visitRoom(card.boonShrines[0],[]));
 const oldSteps=c.state.dungeon.steps,offer=c.state.dungeon.boonOffer;
 assert.equal(offer.ids[0],'wayfarers_bargain');
 c.chooseBoon('wayfarers_bargain');
 assert.equal(c.state.dungeon.steps,oldSteps+1);
 assert.equal(a.stats().maxhp,Math.max(1,Math.round(before.maxhp*.9)));
 assert(c.visitRoom(1));assert(a.enter());
 assert.deepEqual([...a.state().run.boonIds],['wayfarers_bargain']);
 assert.equal(a.state().run.maxhp,Math.max(1,Math.round(before.maxhp*.9)));
});
test('Stage 7.3 Aetherbound Pact modifies native spells only once discovered',()=>{
 const {a,c,card}=directShrine(6304),before=a.baseStats(),gear=JSON.stringify(a.state().equip);
 assert(c.visitRoom(card.boonShrines[0],['magic']));
 assert.equal(c.state.dungeon.boonOffer.ids[0],'aetherbound_pact');
 c.chooseBoon('aetherbound_pact');
 assert.equal(a.stats().spellPower,Math.round(before.spellPower*1.18));
 assert.equal(JSON.stringify(a.state().equip),gear);
 assert(c.visitRoom(1));assert(a.enter());
 assert.equal(B.costFactor(a.state().run),1.2);
 assert.equal(a.state().run.stats.spellPower,Math.round(before.spellPower*1.18));
});
test('Stage 7.3 second Shrine is optional, does not repeat Boons and stops at two',()=>{
 const env=directShrine(6305),{c,card}=env,d=c.state.dungeon;
 assert(c.visitRoom(card.boonShrines[0],['blood']));
 const selected=d.boonOffer.ids[0];c.chooseBoon(selected);
 assert.equal(c.offerBoons(['blood']),null,'combat history no longer creates offers');
 const offer=stageLaterShrine(env,['blood']);
 assert.equal(offer.round,1);
 assert.equal(offer.ids.length,3);assert(!offer.ids.includes(selected));
 const second=offer.ids[1];c.chooseBoon(second);
 assert.deepEqual([...d.foundationState.boonIds],[selected,second]);
 assert.equal(c.offerBoons(['blood']),null);
 assert.equal(c.restore(clone(c.state)).dungeon.foundationState.boonIds.length,2);
});
test('Stage 7.3 leaving a Shrine unused cannot be undone; a later Shrine still works',()=>{
 const env=directShrine(6320),{c,card}=env,d=c.state.dungeon;
 assert(c.visitRoom(card.boonShrines[0],['blood']));
 assert.equal(c.chooseBoon(null),null);
 assert.equal(B.resolutions(d.foundationState).at(-1).type,'skip_boon');
 assert.equal(d.foundationState.boonIds.length,0);
 assert.equal(c.offerBoons(['blood']),null);
 const offer=stageLaterShrine(env,['blood']);
 assert.equal(offer.round,1);assert.equal(offer.ids.length,3);
 c.chooseBoon(offer.ids[0]);
 assert.equal(d.foundationState.boonIds.length,1);
 assert.equal(B.validateOffer(d,c.state),true);
 assert.equal(c.restore(clone(c.state)).dungeon.foundationState.boonIds.length,1);
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
test('Stage 7.3 forged Shrine visits and duplicate Boon choices are rejected',()=>{
 const {c,card}=directShrine(6306);
 assert(c.visitRoom(card.boonShrines[0],['aegis']));
 const valid=clone(c.state),invalid=clone(valid);
 invalid.dungeon.foundationState.boonIds=['bastion_oath'];
 assert.throws(()=>c.restore(invalid),/Invalid/);
 assert.deepEqual(clone(c.state),valid);
 c.chooseBoon(c.state.dungeon.boonOffer.ids[0]);
 const bad=clone(c.state);bad.dungeon.foundationState.boonIds.push(bad.dungeon.foundationState.boonIds[0]);
 assert.throws(()=>c.restore(bad),/Invalid/);
 const tampered=clone(c.state);tampered.dungeon.cards[0].boonShrines.reverse();
 assert.throws(()=>c.restore(tampered),/Invalid/);
});
