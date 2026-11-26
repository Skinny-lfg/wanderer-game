'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');

// This is the exact publicly reproducible v15 progression state from
// Daring 9701 / E3 / attempt 13, native XP 2941 and 28 valid purchased nodes.
// Fixture ONLY: no talents or XP are awarded in the natural simulation.
const E3_NODES=[
 'root_aegis','affinity_aegis','basic_path_aegis_0_1','gate_guarded_block',
 'guarded_block','basic_path_aegis_0_2','gate_barrier_pulse','barrier_pulse',
 'root_radiance','affinity_radiance','basic_path_radiance_0_1',
 'gate_strong_heart','strong_heart','outer_radiance_1_1',
 'outer_radiance_1_2','mixed_path_radiance_aegis_radiance_1',
 'mixed_path_radiance_aegis_radiance_2','mixed_path_radiance_aegis_radiance_3',
 'mixed_path_radiance_aegis_aegis_2','mixed_path_radiance_aegis_aegis_3',
 'mixed_path_radiance_aegis_aegis_1','gate_sanctuary','sanctuary',
 'gate_last_bastion','last_bastion','outer_radiance_-1_1',
 'outer_radiance_-1_2','basic_path_radiance_0_2'
];
function nativePrepared(){
 const a=create(9701,undefined,{}, {skipPersistence:true,now:1720000009701});
 const p={treeVersion:15,xp:2941,nodes:[...E3_NODES],prepared:'last_bastion'};
 assert.equal(a.talents.valid(p),true,'historical native talent state must be valid');
 a.state().automaticTalents=p;
 return {a,p};
}
test('E3 prepared Last Bastion must render full source breakdown with valid native progress',()=>{
 const {a,p}=nativePrepared(),before=JSON.stringify(p);
 const stats=a.stats();
 const breakdown=a.statSources(stats);
 assert.equal(breakdown.length,16);
 for(const part of breakdown)for(const field of ['base','equipment','runes','talents','temporary','total'])
  assert(Number.isFinite(part[field]),part.key+' '+field+' is not finite');
 assert.equal(a.talents.valid(p),true);
 assert.equal(JSON.stringify(p),before,'stat breakdown must never mutate saved native progress');
});
test('E3 advanced prepared ability can render primary-attribute tooltip and complete Inventory',()=>{
 const {a,p}=nativePrepared(),before=JSON.stringify(p);
 const stats=a.stats();
 const markup=a.statMarkup('Strength',stats,stats.str);
 assert.match(markup,/data-stat="str"/);
 a.setView('equipment');
 assert.doesNotThrow(()=>a.gear.renderStash());
 assert.equal(JSON.stringify(p),before,'UI cannot remove prepared or purchased talents');
 assert.equal(a.talents.valid(a.state().automaticTalents),true);
});
test('Temporary no-talents projection does not suppress real prepared talent effects',()=>{
 const {a,p}=nativePrepared();
 const stats=a.stats(),source=a.statSources(stats),before=JSON.stringify(p);
 const direct=a.talents.bonuses(p);
 assert(direct&&typeof direct==='object');
 assert(source.some(row=>Number.isFinite(row.talents)));
 assert.deepEqual(a.state().automaticTalents,p);
 assert.equal(JSON.stringify(p),before);
});
