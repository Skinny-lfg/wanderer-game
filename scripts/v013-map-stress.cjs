const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={};for(const file of ['online/v013-expedition-map.js','economy/v012-loot-rules.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),env);const M=env.WandererV013ExpeditionMap,L=env.WandererV012LootRules;
const GROUPS=[['traveling_merchant','smugglers_caravan','relic_collector','cursed_artificer'],['cursed_altar','soul_mirror','whispering_idol','echo_shrine'],['cursed_chest','forgotten_arsenal','runic_vault','bounty_writ'],['restless_spring','fallen_wanderer','oracle_of_paths','last_ember']];
function expectedNodeDrop(kind){
 const chance=(waves,elite)=>{let miss=1;for(let wave=1;wave<=waves;wave++)miss*=1-L.waveLootOdds(elite&&wave===waves?4:wave,5).drop;return 1-miss;};
 if(kind==='elite')return (chance(2,true)+chance(3,true))/2;
 if(kind!=='combat')return kind==='boss'?1:0;
 const normal=(chance(1,false)+chance(2,false)+chance(3,false))/3,incidentalElite=(chance(1,true)+chance(2,true)+chance(3,true))/3;
 return .8*normal+.2*incidentalElite;
}
const DROP={combat:expectedNodeDrop('combat'),elite:expectedNodeDrop('elite'),boss:expectedNodeDrop('boss'),event:0};
function metrics(path){const elites=path.filter(n=>n.kind==='elite').length,events=path.filter(n=>n.kind==='event').length,combat=path.filter(n=>n.kind==='combat').length;return {elites,events,combat,expectedEliteEquivalents:elites+.2*combat,bonusGold:4*(elites+.2*combat),bonusFragments:3*(elites+.2*combat),expectedWaveCount:elites*2.5+combat*2+3,expectedCombatBossItemDrops:elites*DROP.elite+combat*DROP.combat+1};}
const start=Date.now(),totals={maps:0,paths:0,eliteDistribution:{1:0,2:0,3:0},eventCountDistribution:{3:0,4:0},forks:[0,0,0,0],meanMetrics:{bonusGold:0,bonusFragments:0,expectedEliteEquivalents:0,expectedWaveCount:0,expectedCombatBossItemDrops:0},sampleWaveCount:{sum:0,min:Infinity,max:0},eventIds:new Set()};
for(let seed=0;seed<10000;seed++){
 const dice=M.rng(seed),eventCount=dice()<.5?3:4,map=M.create(seed,{eventCount,eventGroups:GROUPS}),paths=M.allPaths(map);totals.maps++;assert.equal(paths.length,81);
 for(const segment of map.segments){const signatures=segment.paths.map(ids=>ids.map(id=>{const n=M.node(map,id);return n.kind+':'+(n.eventId||'');}).join('|'));assert.equal(new Set(signatures).size,3);totals.forks[segment.decision-1]++;}
 for(let index=0;index<paths.length;index++){
  const path=paths[index],m=metrics(path);assert.equal(path[14].kind,'boss');assert.equal(m.events,eventCount);assert(m.elites>=1&&m.elites<=3);assert.equal(new Set(path.filter(n=>n.kind==='event').map(n=>n.eventId)).size,eventCount);
  const uniqueEventIds=path.filter(n=>n.kind==='event').map(n=>n.eventId);uniqueEventIds.forEach(id=>totals.eventIds.add(id));
  totals.eliteDistribution[m.elites]++;totals.eventCountDistribution[eventCount]++;totals.paths++;for(const key of Object.keys(totals.meanMetrics))totals.meanMetrics[key]+=m[key];
  const roll=M.rng((seed^Math.imul(index+1,0x9e3779b1))>>>0);let waves=0;for(const n of path){if(n.kind==='boss')waves+=3;else if(n.kind==='elite')waves+=2+Math.floor(roll()*2);else if(n.kind==='combat')waves+=1+Math.floor(roll()*3);}totals.sampleWaveCount.sum+=waves;totals.sampleWaveCount.min=Math.min(totals.sampleWaveCount.min,waves);totals.sampleWaveCount.max=Math.max(totals.sampleWaveCount.max,waves);
 }
}
for(const key of Object.keys(totals.meanMetrics))totals.meanMetrics[key]/=totals.paths;
const distribution={one:totals.eliteDistribution[1],two:totals.eliteDistribution[2],three:totals.eliteDistribution[3]},meanElites=(distribution.one+2*distribution.two+3*distribution.three)/totals.paths;
assert.equal(totals.paths,810000);assert.equal(meanElites,2);assert.equal(distribution.one,180000);assert.equal(distribution.two,450000);assert.equal(distribution.three,180000);assert(totals.forks.every(n=>n===10000));assert(totals.eventIds.size===16);
totals.meanMetrics=Object.fromEntries(Object.entries(totals.meanMetrics).map(([k,v])=>[k,Number(v.toFixed(4))]));totals.sampleWaveCount.mean=Number((totals.sampleWaveCount.sum/totals.paths).toFixed(4));delete totals.sampleWaveCount.sum;totals.eventIdCount=totals.eventIds.size;totals.eventIds=[...totals.eventIds].sort();delete totals.elapsedSeconds;totals.elapsedSeconds=Number(((Date.now()-start)/1000).toFixed(2));totals.routeRiskExample={low:metrics(M.walkPath(M.create(17,{eventCount:3,eventGroups:GROUPS}),[2,0,1,2])),high:metrics(M.walkPath(M.create(17,{eventCount:3,eventGroups:GROUPS}),[0,0,0,0]))};
console.log(JSON.stringify(totals,null,2));
