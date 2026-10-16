const assert=require('node:assert/strict'),h=require('./combat-harness.cjs')();
const affinities=['poison','bleed','sunder','crit','shield','regen','burn','slow','drain','nature','shock','tide'];let trials=0,wins=0;
for(const level of [1,10,20,30,40,50,60,70,80,100,150,200])for(const weapon of ['Sword','Mace','Two-Handed','Daggers','Staff','Wand','Bow'])for(let seed=1;seed<=100;seed++){
 const normal=h.simulate({level,weapon,affinity:affinities[seed%affinities.length],seed,speed:1}),fast=h.simulate({level,weapon,affinity:affinities[seed%affinities.length],seed,speed:4});
 for(const r of [normal,fast]){assert.ok(Number.isFinite(r.hp)&&Number.isFinite(r.seconds)&&Number.isFinite(r.power));assert.ok(r.seconds<=900.24,'bounded combat');trials++;wins+=Number(r.won);}
 for(const key of ['won','hp','seconds','durations'])assert.equal(JSON.stringify(normal[key]),JSON.stringify(fast[key]),`${level} ${weapon} ${seed} ${key}`);
}
console.log(`PASS ${trials} deterministic expeditions, D1–D200, seven weapon builds, twelve affinities, 1x/4x equivalence; ${wins} clears, no nonfinite results`);
