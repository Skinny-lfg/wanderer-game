'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

function room(seed){
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.setup(5,'Sword','Rare');a.setUnlocked(5);a.start(5,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[0];c.chooseRealm(card.id);
 const first=card.edges.find(edge=>edge.includes(0));
 assert(first,'No first-ring connection');
 const node=first[0]===0?first[1]:first[0];
 assert.equal(card.nodes[node].kind,'combat','Expected natural first-room combat');
 assert.equal(c.visitRoom(node),true);
 assert.equal(a.enter(),true);
 return {a,c,g,node};
}
test('v0.13 current room rewards settle once; checkpoint/reload cannot mint additional gold or fragments',()=>{
 const {a,g,node}=room(99101),s=a.state(),r=s.run;
 const before={gold:s.gold,fragments:s.fragments};
 for(let n=0;n<80&&r.status==='fight';n++){
  for(const mob of r.enemies?.length?r.enemies:[r.enemy])if(mob)mob.hp=0;
  a.win();a.flush();
 }
 assert.equal(r.status,'cleared','Real native wave must resolve');
 const after={gold:s.gold,fragments:s.fragments};
 assert(after.gold>=before.gold&&after.fragments>=before.fragments);
 const previous=JSON.stringify({gold:s.gold,fragments:s.fragments,stash:s.stash,bag:a.bag.items()});
 assert.equal(a.exitResult(),true);
 assert.equal(g.stage,'choice');
 const snap=a.checkpoint.capture();
 a.checkpoint.restore(snap);
 const restored=a.state();
 assert.equal(restored.gold,after.gold);
 assert.equal(restored.fragments,after.fragments);
 assert.equal(JSON.stringify({gold:restored.gold,fragments:restored.fragments,stash:restored.stash,bag:a.bag.items()}),previous);
 assert(a.controller().state.dungeon.cleared.includes(node),'Room cannot replay on restore');
});
test('v0.13 active dungeon blocks ordinary Camp purchase transactions',()=>{
 const {a}=room(99102),s=a.state();
 s.gold=100000;s.fragments=100000;
 const before={gold:s.gold,fragments:s.fragments,stash:JSON.stringify(s.stash)};
 assert.equal(a.economyCanAct(),false);
 assert.equal(a.purchaseNative(0),false);
 assert.equal(s.gold,before.gold);assert.equal(s.fragments,before.fragments);
 assert.equal(JSON.stringify(s.stash),before.stash);
});
