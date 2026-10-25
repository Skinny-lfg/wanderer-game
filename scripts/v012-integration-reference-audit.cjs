'use strict';
const crypto=require('node:crypto');
const trace=require('../tests/v012-runtime-trace.cjs');
const fixture=require('../tests/fixtures/v012-runtime-reference.json');
const {run}=require('./v012-affinity-combat-sim.cjs');
const observed=[];
for(const c of fixture.cases){
 const calc=()=>{
  const hashes=trace(c.scenario);
  return {steps:hashes.length,digest:crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex')};
 };
 const a=calc(),b=calc();
 if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Nondeterministic trace '+JSON.stringify(c.scenario));
 observed.push({...c,steps:a.steps,digest:a.digest});
 console.log('FIXTURE_CHECK '+JSON.stringify({scenario:c.scenario,oldSteps:c.steps,newSteps:a.steps,changed:a.digest!==c.digest,stable:true,digest:a.digest}));
}
for(const [E,seed]of [[200,7202988],[300,7213124]]){
 const r=run({E,weapon:'Daggers',armorType:'Leather',offhandType:'Off-Hand Dagger',rarity:'Epic',family:'blood',strategy:'triple',runes:true,seed,controlSeed:seed});
 if(r.error||r.timeout)throw Error(String(r.error||'timeout'));
 console.log('D7_CHECK '+JSON.stringify({E,seed,reached:r.reached,damage:r.damage,weaponAttacks:r.weaponAttacks}));
}
console.log('REFERENCE_JSON '+JSON.stringify({...fixture,cases:observed,baselineReason:'Revalidated 2026-10-25 after approved normal-mob role tuning and the passive-then-direct-Between-Realms event flow; all traces were stable across two runs and the D200/E300 off-hand guardrails were rerun.'}));
