'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
require('../online/v013-map-intelligence.js');
const M=globalThis.WandererV013MapIntelligence;

function route(card){
 const target=card.nodes.findIndex(x=>x.kind==='boss');
 assert(target>0);
 const queue=[[0]],seen=new Set([0]);
 for(const path of queue){
  const here=path.at(-1);if(here===target)return path;
  for(const next of M.neighbors(card,{discoveredSecrets:[],visited:[]},here)){
   if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}
  }
 }
 throw Error('No legal native route to boss');
}
function clearRoom(a){
 const r=a.state().run;
 assert.equal(r.status,'fight');
 for(let i=0;r.status==='fight'&&i<100;i++){
  for(const mob of r.enemies?.length?r.enemies:[r.enemy])if(mob)mob.hp=0;
  a.win();a.flush();
 }
 assert.equal(r.status,'cleared');
 return r;
}
function naturalVictory(){
 const a=create(99881,undefined,{}, {skipPersistence:true});
 a.setup(35,'Sword','Legendary');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[0];c.chooseRealm(card.id);
 const path=route(card);
 for(const room of path.slice(1)){
  assert.equal(c.visitRoom(room),true);
  assert.equal(a.enter(),true);
  if(a.events.run()?.event)assert.equal(a.events.choose(2),true);
  else{
   clearRoom(a);
   if(g.stage!=='finished')a.exitResult();
  }
 }
 assert.equal(g.stage,'finished');
 assert.equal(a.results().summary?.outcome,'victory');
 return {a,c,g};
}
test('current v0.13 natural boss victory settles once and restores Camp purchase eligibility',()=>{
 const {a,g}=naturalVictory();
 assert.equal(g.unlocked,36,'Exactly one expedition level unlocked');
 const before={gold:a.state().gold,fragments:a.state().fragments};
 a.exitResult();
 assert.equal(a.economyCanAct(),true,'Camp vendor/forge must unlock after victory');
 assert.equal(a.state().gold,before.gold);
 assert.equal(a.state().fragments,before.fragments);
 a.state().gold+=100000;
 a.rollShop();
 const item=a.state().merchant?.stock?.[0];
 assert(item,'Real Camp merchant must have stock');
 const purchased=a.purchaseNative(0);
 assert.equal(purchased,true,'Camp must allow real native purchase after extraction');
});
test('current v0.13 result reload cannot repeat boss unlock or victory award',()=>{
 const {a,g}=naturalVictory(),unlocked=g.unlocked,before={gold:a.state().gold,fragments:a.state().fragments};
 const snapshot=a.checkpoint.capture();a.checkpoint.restore(snapshot);
 assert.equal(a.controller().state.unlocked,unlocked);
 assert.equal(a.state().gold,before.gold);
 assert.equal(a.state().fragments,before.fragments);
});
