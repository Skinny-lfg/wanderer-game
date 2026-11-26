'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs');
const create=require('./v012-economy-harness.cjs');
require('../online/v012-expedition-events.js');
require('../online/v013-anchor-campaign.js');
const catalog=globalThis.WandererV012IntegratedEvents.CATALOG;
const A=globalThis.WandererV013AnchorCampaign;
const cautious={...N.PROFILES.cautious,name:'Cautious'},daring={...N.PROFILES.cautious,name:'Daring'};
const shard={id:'blood_shard_1',kind:'runestone_shard'},gear={id:'gear',kind:'equipment'},valuable={id:'valuable',kind:'valuable'};
function fake(id,items,accepted,profile=cautious,context={}){
 const calls=[],g={dungeon:{foundationState:{bossPreparation:{},...context}}};
 const a={events:{run:()=>({event:{id}}),choose:(choice,itemId)=>{calls.push([choice,itemId]);return accepted(choice,itemId);}},
 controller:()=>({state:g}),vitals:()=>({hp:100,maxhp:100,mp:0,maxmp:0}),bag:{items:()=>items},state:()=>({equip:{}})};
 return {result:N.resolveEvent(a,profile),calls};
}
test('all nine events pass only an applicable optional item to the native transaction',()=>{
 assert.equal(catalog.length,9);
 for(const {id} of catalog)for(const items of [[],[shard],[gear,valuable,shard]]){
  const {result,calls}=fake(id,items,(c,item)=>item!==shard.id,daring);
  assert.equal(result.event,id);
  const expected=id==='relic_collector'&&result.choice!==2&&items.includes(gear)?gear.id:undefined;
  assert.deepEqual(calls,[[result.choice,expected]],id);
 }
});
test('Relic Collector keeps existing gear preference and uses fallback when no eligible item exists',()=>{
 for(const items of [[],[shard],[valuable,shard]])assert.deepEqual(fake('relic_collector',items,()=>true,daring).calls,[[0,undefined]]);
 assert.deepEqual(fake('relic_collector',[gear,valuable,shard],()=>true,daring).calls,[[0,gear.id]]);
 assert.deepEqual(fake('relic_collector',[gear,shard],()=>true,cautious).calls,[[2,undefined]]);
});
test('fallback choice and oath retain existing policy; pass never includes an item',()=>{
 assert.deepEqual(fake('traveling_merchant',[shard],c=>c===2).calls,[[1,undefined],[2,undefined]]);
 assert.deepEqual(fake('forgotten_reliquary',[shard],()=>true,daring,{contractId:'oath_of_defiance'}).calls,[[1,undefined]]);
 assert.deepEqual(fake('relic_collector',[gear,shard],c=>c===2,daring).calls,[[0,gear.id],[2,undefined]]);
});
function pending(family){
 for(let seed=0;seed<10000;seed++){
  const c=A.observeVictory(A.collection(),{seed,family,node:2,kind:'normal'});
  if(c.expedition.pending)return c;
 }
 throw Error('Could not construct a pending shard fixture');
}
function scenario(id,bagMode){
 const a=create(9312,undefined,{}, {skipPersistence:true});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[2];c.chooseRealm(card.id);
 card.nodes[1].kind='event';card.nodes[1].event=id;
 if(id==='forgotten_reliquary')card.reliquaryRoom=1;
 assert.equal(c.visitRoom(1),true);assert.equal(a.enter(),true);
 if(bagMode==='mixed')a.bag.mark(a.makeItem(35,'helm',null,'loot','random','Common'));
 if(bagMode!=='empty')a.state().anchorCollection=pending(card.family);
 const items=Array.from(a.bag.items()),idShard=items.find(i=>i.kind==='runestone_shard')?.id;
 if(bagMode!=='empty')assert(idShard,'native pending shard must appear in Bag');
 return {a,g,idShard,items};
}
function snapshot(a){const s=a.state();return JSON.stringify({gold:s.gold,fragments:s.fragments,xp:s.automaticTalents.xp,crafting:s.crafting,stash:s.stash,overflow:s.expeditionOverflow,valuables:s.valuables,anchors:s.anchorCollection,vitals:a.vitals()});}
for(const {id} of catalog)for(const mode of ['empty','shard','mixed'])test('native '+id+' / '+mode+' resolves once and protects shard',()=>{
 const {a,g,idShard,items}=scenario(id,mode);
 const prior=snapshot(a),xp=a.state().automaticTalents.xp;
 if(idShard){
  // Reproduce the old payload against the real native guard. Even pass fails.
  assert.equal(a.events.choose(2,idShard),false);
  assert.equal(snapshot(a),prior);
 }
 const result=N.resolveEvent(a,daring);
 assert.equal(result.event,id);
 assert.equal(a.events.run()?.event??null,null);
 assert(g.dungeon.cleared.includes(1));
 if(idShard)assert(a.bag.items().some(i=>i.id===idShard),'protected shard must survive');
 if(result.choice===2)assert.equal(a.state().automaticTalents.xp,xp,'pass awards no event XP');
 else assert(a.state().automaticTalents.xp>=xp,'XP must not decrease');
 const gearItem=items.find(i=>i.kind!=='runestone_shard'&&i.kind!=='valuable');
 if(gearItem)assert.equal(a.bag.items().some(i=>i.id===gearItem.id),id!=='relic_collector'||result.choice===2);
 const after=snapshot(a);
 assert.equal(a.events.choose(result.choice),false,'duplicate settlement rejected');
 assert.equal(N.resolveEvent(a,daring),null);
 assert.equal(snapshot(a),after,'no repeated rewards, XP or resource change');
});
