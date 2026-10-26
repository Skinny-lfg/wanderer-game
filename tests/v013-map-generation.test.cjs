const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};vm.runInNewContext(fs.readFileSync('online/v013-expedition-map.js','utf8'),env);const M=env.WandererV013ExpeditionMap;
const GROUPS=[['traveling_merchant','smugglers_caravan','relic_collector','cursed_artificer'],['cursed_altar','soul_mirror','whispering_idol','echo_shrine'],['cursed_chest','forgotten_arsenal','runic_vault','bounty_writ'],['restless_spring','fallen_wanderer','oracle_of_paths','last_ember']];
function plan(seed){const random=M.rng(seed);return {eventCount:random()<.5?3:4,eventGroups:GROUPS};}
test('10,000 deterministic maps give four meaningful forks and balanced route risks',()=>{
 let totals={paths:0,eliteCounts:{1:0,2:0,3:0},events:{3:0,4:0},distinctForks:[0,0,0,0]};
 for(let seed=0;seed<10000;seed++){
  const eventPlan=plan(seed),a=M.create(seed,eventPlan),b=M.create(seed,eventPlan);assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
  assert.equal(a.rows.length,15);assert.equal(a.nodes.length,35);assert.equal(a.rows[14][0].kind,'boss');assert.equal(a.segments.length,4);assert.equal(JSON.stringify(a.segments.map(s=>s.decision)),JSON.stringify([1,2,3,4]));
  assert.equal(JSON.stringify(a.segments.map(s=>s.end-s.start+1)),JSON.stringify([3,3,2,2]));
  for(const segment of a.segments){const patterns=segment.paths.map(path=>path.map(id=>{const n=M.node(a,id);return n.kind+':'+(n.eventId||'');}).join('|'));assert.equal(new Set(patterns).size,3);totals.distinctForks[segment.decision-1]++;}
  const paths=M.allPaths(a);assert.equal(paths.length,81);
  for(const path of paths){
   assert.equal(path.length,15);assert.equal(path[14].kind,'boss');
   const elites=path.filter(n=>n.kind==='elite').length,events=path.filter(n=>n.kind==='event');assert([1,2,3].includes(elites));assert.equal(events.length,eventPlan.eventCount);assert.equal(new Set(events.map(n=>n.eventId)).size,eventPlan.eventCount);
   totals.eliteCounts[elites]++;totals.events[eventPlan.eventCount]++;totals.paths++;
   for(let i=1;i<path.length;i++)assert(M.successors(a,path[i-1].id).includes(path[i].id));
  }
  assert.equal(paths.reduce((sum,path)=>sum+path.filter(n=>n.kind==='elite').length,0),paths.length*2,'average explicit Elite count preserves existing distribution');
  assert.equal(M.calendar(a).filter(kind=>kind==='elite').length,2,'legacy schedule view remains a balanced two-Elite route');
  assert.equal(M.calendar(a).filter(kind=>kind==='event').length,eventPlan.eventCount);M.validate(a,M.calendar(a),GROUPS);
 }
 assert.equal(totals.paths,810000);assert.equal(totals.eliteCounts[1],180000);assert.equal(totals.eliteCounts[2],450000);assert.equal(totals.eliteCounts[3],180000);
 assert.equal(totals.events[3]+totals.events[4],totals.paths);assert(totals.distinctForks.every(n=>n===10000));
 console.log('ROUTE_METRICS '+JSON.stringify(totals));
});
test('route progress cannot switch branches, omit successors, or strand a checkpoint',()=>{
 const m=M.create(42,{...plan(42),eventCount:3}),root=m.rows[0][0].id;
 assert.equal(M.choose(m,'r2n1'),false);assert.equal(M.choose(m,root),true);assert.equal(M.choose(m,root),false);assert.equal(m.availableNodeIds.length,0);
 assert(M.validate(m,M.calendar(m),GROUPS));
 assert.throws(()=>M.validate({...m,availableNodeIds:[m.rows[1][1].id]},M.calendar(m),GROUPS),/available map path/);
 assert.equal(M.complete(m,root),true);assert.equal(M.complete(m,root),false);assert.equal(m.availableNodeIds.length,3);
 assert.equal(M.choose(m,m.availableNodeIds[0]),true);assert.equal(m.availableNodeIds.length,0);assert(M.validate(m,M.calendar(m),GROUPS));
});
