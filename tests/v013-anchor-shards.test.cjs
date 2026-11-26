'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../online/v013-anchor-campaign.js');
const A=globalThis.WandererV013AnchorCampaign;
const observe=(c,seed,kind='normal',node=1,family='blood')=>A.observeVictory(c,{seed,kind,node,family});
function sample(kind,wanted){for(let seed=0;seed<10000;seed++){const c=observe(A.collection(),seed,kind);if(Boolean(c.expedition.pending)===wanted)return seed;}throw Error('No matching seed');}
test('deterministic separate channel; one pending shard and duplicate room is a no-op',()=>{
 const seed=sample('normal',true),c=A.collection(),x=observe(c,seed);
 assert.deepEqual(x,observe(c,seed));assert(A.validCollection(JSON.parse(JSON.stringify(x))));assert.equal(A.bag(x).pending.kind,'runestone_shard');
 assert.equal(observe(x,seed),x);const y=observe(x,seed,'elite',2);assert.equal(y.expedition.pending,x.expedition.pending);assert.equal(A.bag(y).secured.length,0);
});
test('settlement preserves only extracted or victorious finds, no double award',()=>{
 const x=observe(A.collection(),sample('normal',true));
 for(const outcome of ['defeat','abandoned','cancelled']){const c=A.settleCollection(x,outcome);assert.equal(A.bag(c).secured.length,0);assert.equal(c.expedition,null);}
 for(const outcome of ['extracted','victory']){const c=A.settleCollection(x,outcome);assert.equal(A.bag(c).secured.length,1);assert.equal(A.bag(c).pending,null);assert.equal(A.settleCollection(c,outcome),c);}
});
test('fifth boss dry streak guarantees missing shard; reset on secured drop',()=>{
 let c=A.collection();const seed=sample('boss',false);for(let n=1;n<5;n++){c=A.settleCollection(observe(c,seed,'boss'),'victory');assert.equal(c.pity.blood,n);}
 const x=observe(c,seed,'boss');assert(x.expedition.pending);c=A.settleCollection(x,'victory');assert.equal(c.pity.blood,0);assert.equal(A.bag(c).secured.length,1);
});
test('no duplicate secured shards, open portal stops drops, independent families',()=>{
 let c=A.collection();
 for(let n=0;n<3;n++){c.pity.blood=4;c=A.settleCollection(observe(c,123+n,'boss'),'victory');}
 assert.equal(A.bag(c).secured.length,3);assert.equal(new Set(A.bag(c).secured.map(x=>x.id)).size,3);
 c=A.assembleCollection(c,'blood');assert.equal(A.status(c.campaign,'blood'),'open');assert.equal(A.bag(observe(c,7,'boss')).pending,null);
 assert.equal(c.pity.decay,0);assert(A.validCollection(c));
});
test('native harness encounter reward and save/checkpoint preservation',()=>{
 const create=require('./v012-economy-harness.cjs');
 const a=create(871,undefined,{}, {skipPersistence:true});a.setup(50,'Sword','Epic');a.start(1,true);
 const g=a.controller(),card=g.state.dungeon.cards[0];g.chooseRealm(card.id);
 const room=card.edges.filter(([from])=>from===0).map(([,to])=>to).find(i=>card.nodes[i].kind==='combat');
 assert(g.visitRoom(room));assert(a.enter());const r=a.state().run;for(const mob of r.enemies||[r.enemy])mob.hp=0;r.groupReserve=[];a.win();
 const c=a.state().anchorCollection;assert(c&&A.validCollection(c));assert.equal(c.expedition.family,card.family);assert(c.expedition.seen.includes(room));
 const cp=a.checkpoint.capture();assert.deepEqual(JSON.parse(JSON.stringify(cp.profile.anchorCollection)),JSON.parse(JSON.stringify(c)));a.checkpoint.restore(cp);
 assert(A.validCollection(a.state().anchorCollection));a.abandon();assert.equal(a.state().anchorCollection.expedition,null);assert.equal(A.bag(a.state().anchorCollection).secured.length,0);
});

test('native local save keeps an at-risk shard across reload, then extraction secures it exactly once',()=>{
 const create=require('./v012-economy-harness.cjs'),storage=new Map(),options={localStorage:storage};
 let a=create(871,undefined,{},options);a.setup(50,'Sword','Epic');a.start(1,true);
 let g=a.controller(),card=g.state.dungeon.cards[0];g.chooseRealm(card.id);
 const room=card.edges.filter(([from])=>from===0).map(([,to])=>to).find(i=>card.nodes[i].kind==='combat');
 assert(g.visitRoom(room));assert(a.enter());const r=a.state().run;for(const mob of r.enemies||[r.enemy])mob.hp=0;r.groupReserve=[];a.win();
 let c=a.state().anchorCollection;assert(c&&A.validCollection(c));
 // Guarantee a physical shard fixture in the already completed native room;
 // actual RNG and drop policy are exercised independently above.
 if(!c.expedition.pending)c.expedition.pending=A.get(card.family).shards[0].id;
 const id=c.expedition.pending;assert(a.exitResult());assert([...storage.values()].some(raw=>typeof raw==='string'&&raw.includes(id)));
 a=create(871,undefined,{},options);assert.equal(a.state().anchorCollection.expedition.pending,id);
 assert(a.checkpoint.extract(),'native extraction must settle the physical shard');
 assert.equal(a.state().anchorCollection.expedition,null);assert(A.bag(a.state().anchorCollection).secured.some(s=>s.id===id));
 a=create(871,undefined,{},options);assert.equal(a.state().anchorCollection.expedition,null);assert.equal(A.bag(a.state().anchorCollection).secured.filter(s=>s.id===id).length,1);
});
