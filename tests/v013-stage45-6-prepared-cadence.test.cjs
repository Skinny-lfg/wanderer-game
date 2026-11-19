'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {api,build,context}=require('./v012-affinity-fixture.cjs');
const {T,buy}=require('./v013-current-talent-helper.cjs');

test('v15 separates prepared Reaper\'s Cadence and Rupture without duplicate nodes',()=>{
 const skill=T.NODES.find(n=>n.id==='septic_wound');
 assert(skill,'Current prepared Reaper\'s Cadence must exist');
 assert.equal(skill.name,"Reaper's Cadence");
 assert.equal(T.NODES.filter(n=>n.id==='septic_wound').length,1);
 const rupture=T.NODES.find(n=>n.id==='reapers_cadence'||n.passiveId==='reapers_cadence');
 assert(rupture,'Buildcraft Rupture must be reachable from current v15');
 assert.equal(api.CATALOG.find(p=>p.id==='reapers_cadence')?.name,'Rupture');
 assert.equal(new Set(T.NODES.map(n=>n.id)).size,343);
 const a=buy(['septic_wound']);assert(a.nodes.includes('septic_wound'));
 const b=buy([rupture.id]);assert(b.nodes.includes(rupture.id));
 assert(T.passiveIds(b).includes('reapers_cadence'),'Native v15 purchase must grant Rupture');
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
