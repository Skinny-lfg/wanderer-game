'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {api,build,context}=require('./v012-affinity-fixture.cjs');

function cadenceFixture(){
 const b=build(['reapers_cadence'],['blood','fury']);
 const {c,calls}=context(b);
 c.enemy.dots.bleed=[{damage:10,remaining:3}];
 c.enemy.bleedStacks=1;
 return {b,c,calls};
}
test('v0.13 Reaper’s Cadence requires both Bleed and Fury Sunder, not Bleed alone',()=>{
 const {b,c,calls}=cadenceFixture();
 c.enemy.furySunder=0;
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.reapers_cadence?.activations||0,0,
   'A Bleeding enemy without Fury Sunder must not activate Cadence');
 assert(!calls.some(x=>x[0]==='damage'&&x[2]==='🩸 Rupture'));
 c.enemy.furySunder=1;
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.reapers_cadence?.activations,1,
   'Both statuses activate Cadence once');
 assert(calls.some(x=>x[0]==='damage'&&x[2]==='🩸 Rupture'));
});
test('v0.13 Reaper’s Cadence honours 5s cooldown through serialized checkpoints',()=>{
 const {b,c}=cadenceFixture();
 c.enemy.furySunder=1;
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.reapers_cadence?.activations,1);
 const persisted=api.validate(JSON.parse(JSON.stringify(b)));
 c.now=1;
 api.onAttack(persisted,c);
 assert.equal(persisted.runtime.passiveTelemetry?.reapers_cadence?.activations,1);
 c.now=6;
 api.onAttack(persisted,c);
 assert.equal(persisted.runtime.passiveTelemetry?.reapers_cadence?.activations,2);
});
