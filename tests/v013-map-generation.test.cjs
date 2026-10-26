const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};vm.runInNewContext(fs.readFileSync('online/v013-expedition-map.js','utf8'),env);const M=env.WandererV013ExpeditionMap;
const GROUPS=[['traveling_merchant','smugglers_caravan','relic_collector','cursed_artificer'],['cursed_altar','soul_mirror','whispering_idol','echo_shrine'],['cursed_chest','forgotten_arsenal','runic_vault','bounty_writ'],['restless_spring','fallen_wanderer','oracle_of_paths','last_ember']];
function plan(seed){const random=M.rng((seed^0x9e3779b9)>>>0);return {eventCount:random()<.5?3:4,eventGroups:GROUPS};}

test('10,000 seeded maps generate distinct valid topologies and preserve encounter/economy rules',()=>{
 const topologies=new Map(),decisions=new Map(),choiceWidths={2:0,3:0},eliteCounts={1:0,2:0,3:0},eventCounts={3:0,4:0};let pathsTotal=0,nodesTotal=0;
 for(let seed=0;seed<10000;seed++){
  const eventPlan=plan(seed),map=M.create(seed,eventPlan),repeat=M.create(seed,eventPlan);assert.deepEqual(JSON.parse(JSON.stringify(map)),JSON.parse(JSON.stringify(repeat)));
  assert.equal(map.version,3);assert.equal(map.rows.length,15);assert.equal(map.rows[14].length,1);assert.equal(map.rows[14][0].kind,'boss');assert(map.segments.length===3||map.segments.length===4);assert([3,4].includes(map.eventCount));
  const shape=map.rows.map(row=>row.length).join('');topologies.set(map.topologyId,(topologies.get(map.topologyId)||0)+1);decisions.set(map.segments.length,(decisions.get(map.segments.length)||0)+1);choiceWidths[2]+=map.segments.filter(s=>s.width===2).length;choiceWidths[3]+=map.segments.filter(s=>s.width===3).length;nodesTotal+=map.nodes.length;
  for(const segment of map.segments){assert(segment.start>1&&segment.start<segment.end&&segment.end<=14,'every route remains separated for at least two Realms');assert(segment.width===2||segment.width===3);assert.equal(segment.join,segment.end+1);for(const path of segment.paths)assert.equal(path.length,segment.end-segment.start+1);}
  assert(map.segments.every((s,i)=>!i||map.segments[i-1].join<s.start),'fork segments have distinct merge points');
  const paths=M.allPaths(map),expected=map.segments.reduce((count,segment)=>count*segment.width,1);assert.equal(paths.length,expected);pathsTotal+=paths.length;
  assert(M.calendar(map).filter(kind=>kind==='elite').length>=1&&M.calendar(map).filter(kind=>kind==='elite').length<=3);assert.equal(M.calendar(map).filter(kind=>kind==='event').length,eventPlan.eventCount);
  for(const segment of map.segments){const lanes=segment.paths.map(path=>path.map(id=>{const node=M.node(map,id);return node.kind+':'+(node.eventId||'');}).join('|'));assert.equal(new Set(lanes).size,segment.width,'each fork changes the event or risk encountered');}
  let mapRiskCount=0;for(const path of paths){assert.equal(path.length,15);assert.equal(path[0].realm,1);assert.equal(path[14].kind,'boss');for(let i=1;i<path.length;i++)assert(M.successors(map,path[i-1].id).includes(path[i].id));const elites=path.filter(n=>n.kind==='elite').length,events=path.filter(n=>n.kind==='event');assert(elites>=1&&elites<=3);assert.equal(events.length,eventPlan.eventCount);assert.equal(new Set(events.map(n=>n.eventId)).size,eventPlan.eventCount);eliteCounts[elites]++;eventCounts[eventPlan.eventCount]++;assert(path.some(n=>n.id===map.guaranteedEliteNodeId));mapRiskCount+=path.filter(n=>n.kind==='elite'&&n.realm>=map.segments[map.riskDecision-1].start&&n.realm<=map.segments[map.riskDecision-1].end).length;}
  assert.equal(paths.reduce((sum,path)=>sum+path.filter(n=>n.kind==='elite').length,0),paths.length*2,'mean Elite count preserves the encounter budget');
  assert.equal(mapRiskCount,paths.length,'risk routes add one Elite on average');
  assert.equal(M.validate(map,M.calendar(map),GROUPS),true);
  const reachable=new Set([map.rows[0][0].id]);for(const row of map.rows)for(const node of row)if(reachable.has(node.id))for(const next of M.successors(map,node.id))reachable.add(next);assert.equal(reachable.size,map.nodes.length);
  if(seed<9)assert.equal(shape.length,15);
 }
 assert.equal(topologies.size,M.TOPOLOGIES.length);assert.equal(topologies.size,9);assert.equal(decisions.get(3)+decisions.get(4),10000);assert(choiceWidths[2]>0&&choiceWidths[3]>0);assert.equal(nodesTotal/10000<50,true);assert.equal(eventCounts[3]+eventCounts[4],pathsTotal);assert.equal(eliteCounts[1]+eliteCounts[2]+eliteCounts[3],pathsTotal);
 console.log('V013_TOPOLOGY_METRICS '+JSON.stringify({topologies:Object.fromEntries(topologies),decisionCounts:Object.fromEntries(decisions),choiceWidths,eliteCounts,eventCounts,pathsTotal,nodesTotal,averageNodes:nodesTotal/10000}));
});

test('map progress persists the selected route, requires completed nodes, and remains reloadable',()=>{
 const map=M.create(42,{...plan(42),eventCount:3}),root=map.rows[0][0].id;assert.equal(M.choose(map,'r2n1'),false);assert.equal(M.choose(map,root),true);assert.equal(M.choose(map,root),false);assert.equal(map.availableNodeIds.length,0);assert(M.validate(map,M.calendar(map),GROUPS));
 assert.throws(()=>M.validate({...map,availableNodeIds:[map.rows[1][0].id]},M.calendar(map),GROUPS),/available map path/);assert.equal(M.complete(map,root),true);assert.equal(M.complete(map,root),false);assert.equal(map.availableNodeIds.length,map.rows[1].length);
 const checkpoint=JSON.parse(JSON.stringify(map));assert(M.validate(checkpoint,M.calendar(checkpoint),GROUPS));assert.equal(M.choose(map,map.availableNodeIds[0]),true);assert.equal(map.availableNodeIds.length,0);assert(M.validate(map,M.calendar(map),GROUPS));
});
