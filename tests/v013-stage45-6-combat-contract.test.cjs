'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {api,build,context}=require('./v012-affinity-fixture.cjs');

function cadenceFixture(){
 const b=build(['rupture'],['blood','fury']);
 const {c,calls}=context(b);
 c.enemy.dots.bleed=[{damage:10,remaining:3}];
 c.enemy.bleedStacks=1;
 return {b,c,calls};
}
test('legacy Rupture (rupture) requires Bleed and Fury Sunder',()=>{
 const {b,c,calls}=cadenceFixture();
 c.enemy.furySunder=0;
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.rupture?.activations||0,0,
   'A Bleeding enemy without Fury Sunder must not activate Cadence');
 assert(!calls.some(x=>x[0]==='damage'&&x[2]==='🩸 Rupture'));
 c.enemy.furySunder=1;
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.rupture?.activations,1,
   'Both statuses activate Cadence once');
 assert(calls.some(x=>x[0]==='damage'&&x[2]==='🩸 Rupture'));
});
test('legacy Rupture has a 5s cooldown through serialized checkpoints',()=>{
 const {b,c}=cadenceFixture();
 c.enemy.furySunder=1;
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.rupture?.activations,1);
 const persisted=api.validate(JSON.parse(JSON.stringify(b)));
 c.now=1;
 api.onAttack(persisted,c);
 assert.equal(persisted.runtime.passiveTelemetry?.rupture?.activations,1);
 c.now=6;
 api.onAttack(persisted,c);
 assert.equal(persisted.runtime.passiveTelemetry?.rupture?.activations,2);
});

test('legacy Rupture is capped at 3% enemy maximum Health',()=>{
 for(const type of ['normal','elite','boss']){
  const {b,c,calls}=cadenceFixture();
  c.enemy.maxhp=100;c.enemy.hp=100;
  c.enemy.boss=type==='boss';c.enemy.miniboss=type==='elite';
  c.enemy.furySunder=1;
  c.enemy.dots.bleed=[{damage:10,remaining:3}];
  api.onAttack(b,c);
  const hit=calls.find(x=>x[0]==='damage'&&x[2]==='🩸 Rupture');
  assert(hit, 'Cadence must activate for '+type);
  assert(hit[1]>0&&hit[1]<=3,'3% boss/elite/normal cap');
 }
});
