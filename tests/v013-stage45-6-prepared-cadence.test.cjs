'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {api,build,context}=require('./v012-affinity-fixture.cjs');
require('../combat/v012-buildcraft.js');
require('../combat/automatic-talents.js');
const T=globalThis.WandererAutomaticTalents;

test('current talent graph distinguishes prepared Reaper’s Cadence from old Rupture',()=>{
 const newNode=T.NODES.find(n=>n.id==='septic_wound');
 assert(newNode,'Current prepared Reaper’s Cadence missing');
 assert.equal(newNode.name,"Reaper's Cadence");
 assert(newNode.prerequisites?.length===2);
 const oldNode=T.NODES.find(n=>n.id==='passive_reapers_cadence');
 assert(oldNode,'Legacy Rupture still exists: removing it would require an intentional design migration');
 assert.equal(oldNode.name,'Rupture');
 assert.equal(oldNode.passiveId,'reapers_cadence');
 assert(T.path({...T.create(),xp:100000},oldNode.id)?.includes(oldNode.id),
  'Legacy Rupture has a graph route and cannot be called fully removed');
});

function prepared(){
 const b=build([],['blood','decay']);
 b.runtime.prepared='septic_wound';
 const {c,calls}=context(b);
 c.enemy.dots.bleed=[{damage:10,remaining:3}];
 c.enemy.bleedStacks=1;
 c.enemy.v012Rot=[{damage:10,remaining:3}];
 return {b,c,calls};
}
test('prepared Reaper’s Cadence requires Bleed AND Rot and does not consume either',()=>{
 const {b,c,calls}=prepared();
 const savedBleed=JSON.stringify(c.enemy.dots.bleed);
 const savedRot=JSON.stringify(c.enemy.v012Rot);
 c.enemy.v012Rot=[];
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.septic_wound?.activations||0,0,'No Rot: no Cadence');
 c.enemy.v012Rot=JSON.parse(savedRot);
 api.onAttack(b,c);
 assert.equal(b.runtime.passiveTelemetry?.septic_wound?.activations,1,'Both statuses trigger');
 assert(calls.some(x=>x[0]==='damage'&&x[2]==="☠ Reaper's Cadence"));
 assert.equal(JSON.stringify(c.enemy.dots.bleed),savedBleed);
 assert.equal(JSON.stringify(c.enemy.v012Rot),savedRot);
});
test('prepared Reaper’s Cadence: six second cooldown survives serialization and 4% boss cap',()=>{
 for(const kind of ['normal','elite','boss']){
  const {b,c,calls}=prepared();
  c.enemy.hp=100;c.enemy.maxhp=100;
  c.enemy.boss=kind==='boss';c.enemy.miniboss=kind==='elite';
  api.onAttack(b,c);
  const hit=calls.find(x=>x[0]==='damage'&&x[2]==="☠ Reaper's Cadence");
  assert(hit,'Expected prepared effect: '+kind);
  assert(hit[1]>0&&hit[1]<=4,'Max 4% target HP: '+kind);
  const copy=api.validate(JSON.parse(JSON.stringify(b)));
  c.now=1;
  api.onAttack(copy,c);
  assert.equal(copy.runtime.passiveTelemetry?.septic_wound?.activations,1);
  c.now=7;
  api.onAttack(copy,c);
  assert.equal(copy.runtime.passiveTelemetry?.septic_wound?.activations,2);
 }
});
