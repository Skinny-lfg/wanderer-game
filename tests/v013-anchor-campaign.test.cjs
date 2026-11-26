'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
require('../online/v013-anchor-campaign.js');
const A=globalThis.WandererV013AnchorCampaign;
const roundtrip=s=>JSON.parse(JSON.stringify(s));
function open(s,id){for(const shard of A.get(id).shards)s=A.grantSecuredShard(s,shard.id);return A.openPortal(s,id);}
test('six approved catalogue sets, eighteen distinct physical shards, placeholder art only',()=>{
 assert.equal(A.CATALOG.length,6);const shards=A.CATALOG.flatMap(x=>x.shards);
 assert.equal(new Set(shards.map(x=>x.id)).size,18);
 for(const r of A.CATALOG){assert.equal(r.art,'placeholder');assert.deepEqual(r.shards.map(x=>x.part),[1,2,3]);assert(r.shards.every(x=>x.kind==='runestone_shard'&&x.family===r.id));}
 assert.equal(A.get('radiance').identityPending,true);
});
test('clean campaign and JSON roundtrip, no mutation or invalid IDs',()=>{
 const s=A.create();assert(A.valid(roundtrip(s)));assert.equal(A.summary(s).conquered,0);assert(!A.finalUnlocked(s));assert.equal(A.grantSecuredShard(s,'fragments'),null);assert.equal(A.grantSecuredShard(s,'wisdom'),null);assert.equal(A.openPortal(s,'blood'),null);assert.equal(A.startAttempt(s,'blood'),null);
 const t=A.grantSecuredShard(s,'blood_shard_1');assert.equal(s.realms.blood.shards.length,0);assert.equal(t.realms.blood.shards.length,1);assert.equal(A.grantSecuredShard(t,'blood_shard_1'),null);
});
test('three complementary shards only; other sets cannot substitute; assembly opens permanently',()=>{
 let s=A.create();for(const id of ['blood_shard_1','blood_shard_2','decay_shard_3'])s=A.grantSecuredShard(s,id);
 assert.equal(A.openPortal(s,'blood'),null);s=A.grantSecuredShard(s,'blood_shard_3');assert.equal(A.status(s,'blood'),'ready_to_unlock');assert.equal(A.missingShards(s,'blood').length,0);
 s=A.openPortal(s,'blood');assert.equal(A.status(s,'blood'),'open');assert.equal(s.realms.blood.shards.length,0);assert.equal(A.grantSecuredShard(s,'blood_shard_1'),null);assert.equal(A.openPortal(s,'blood'),null);
 assert.deepEqual(s.realms.decay.shards,['decay_shard_3']);
});
test('defeat retains portal; stale tokens cannot settle or grant victory; retry needs no new shards',()=>{
 let s=open(A.create(),'blood');s=A.startAttempt(s,'blood');const first=s.active.token;
 assert(A.valid(roundtrip(s)));assert.equal(A.startAttempt(s,'blood'),null);assert.equal(A.grantSecuredShard(s,'decay_shard_1'),null);
 assert.equal(A.settleAttempt(s,first+1,'victory'),null);s=A.settleAttempt(s,first,'defeat');assert.equal(A.status(s,'blood'),'open');assert.equal(A.difficultyStep(s,'blood'),0);
 s=A.startAttempt(s,'blood');assert.notEqual(s.active.token,first);assert.equal(A.settleAttempt(s,first,'victory'),null);s=A.settleAttempt(s,s.active.token,'victory');assert.equal(A.status(s,'blood'),'conquered');assert.equal(A.startAttempt(s,'blood'),null);assert.equal(A.difficultyStep(s,'decay'),1);
});
test('all six first conquests escalate only unfinished Anchors and unlock seventh after sixth',()=>{
 let s=A.create();const order=['arcane','blood','fury','decay','aegis','radiance'];for(const id of order)s=open(s,id);
 for(let i=0;i<order.length;i++){
  const id=order[i];assert.equal(A.difficultyStep(s,id),i);s=A.startAttempt(s,id);assert.equal(s.active.difficultyStep,i);s=A.settleAttempt(s,s.active.token,'victory');assert(A.valid(roundtrip(s)));assert.equal(A.finalUnlocked(s),i===5);assert.equal(A.difficultyStep(s,id),null);assert.equal(A.summary(s).conquered,i+1);
 }
});
test('reject invalid serialization, duplicate shards, wrong families, forged active steps',()=>{
 const s=A.create();for(const mutate of [x=>x.version=2,x=>x.realms.blood.shards=['blood_shard_1','blood_shard_1'],x=>x.realms.blood.shards=['decay_shard_1'],x=>x.realms.blood.portal='ready_to_unlock',x=>x.active={realm:'blood',token:1,difficultyStep:5},x=>x.extra=true]){const bad=roundtrip(s);mutate(bad);assert(!A.valid(bad));}
 const active=A.startAttempt(open(s,'blood'),'blood');active.active.difficultyStep=4;assert(!A.valid(active));
});
test('source and preview mirror are identical; no live integration yet',()=>{assert.equal(fs.readFileSync('online/v013-anchor-campaign.js','utf8'),fs.readFileSync('docs/online/v013-anchor-campaign.js','utf8'));assert(!fs.readFileSync('index.html','utf8').includes('online/v013-anchor-campaign.js'));});
