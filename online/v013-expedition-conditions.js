// Wanderer v0.13 Stage 5 — Expedition Conditions.
// Deterministic plan + thin hooks into the existing map and native combat.
// No new combat engine; map topology, boss modifier conflicts and core RNG untouched.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation;
if(!F)throw Error('Stage 5 conditions require Stage 0 foundation');
const get=id=>F.lookup('conditions',id);
const GUIDE=Object.freeze({
 relentless_hunt:{danger:'Two marked encounters attack 15% faster.',counter:'Prioritise Control, Barrier or defensive talents before the marked fights.'},
 carrion_swarm:{danger:'Two marked fights contain 18–22 weaker enemies.',counter:'Area damage and attack-speed skills handle reinforcements.'},
 unbroken_ward:{danger:'The boss begins with Barrier equal to 15% of its maximum Health.',counter:'Sustained attacks and Barrier-breaking weapons are valuable.'},
 blighted_ground:{danger:'Your healing is reduced by 15% in two marked encounters.',counter:'Save healing potions for unmarked rooms; Barrier is unaffected.'},
 veiled_passages:{danger:'Two marked passages cost one extra step on their first traversal.',counter:'Plan your route; a previously crossed passage has its normal travel cost.'},
 sanguine_rite:{danger:'Below 50% Health the boss gains 12% Attack and 8% attack speed, once.',counter:'Reserve defenses or burst damage for the second phase.'}
});
const edgeId=(a,b)=>Math.min(a,b)+'-'+Math.max(a,b);
function pick(items,count,rng){
 const result=[...items];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result.slice(0,count);
}
function plan(card,seed,conditionId){
 const condition=get(conditionId);
 if(!card||!condition||!condition.families.includes(card.family)||!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid Stage 5 Realm Condition');
 const rng=F.rng(seed,'condition_v1_'+card.id+'_'+conditionId);
 const params=condition.params;
 const candidateRooms=card.nodes.map((node,id)=>node.kind==='combat'&&id>=5?id:-1).filter(id=>id>=0);
 const rooms=params.markedEncounters?pick(candidateRooms,params.markedEncounters,rng):[];
 if(params.markedEncounters&&rooms.length!==params.markedEncounters)throw Error('Insufficient normal rooms for Condition');
 const candidateEdges=card.edges.filter(([a,b])=>a!==0&&b!==0&&!root.WandererV013MapIntelligence?.secretEdge(card,a,b)).map(([a,b])=>edgeId(a,b));
 const edges=params.markedEdges?pick(candidateEdges,params.markedEdges,rng):[];
 if(params.markedEdges&&edges.length!==params.markedEdges)throw Error('Insufficient passages for Condition');
 const counts=Object.create(null);
 if(conditionId==='carrion_swarm')for(const room of rooms)counts[room]=params.minMobs+Math.floor(rng()*(params.maxMobs-params.minMobs+1));
 return {id:conditionId,name:condition.name,rooms,edges,counts};
}
function forGame(game,card){
 const d=game?.dungeon;
 const id=d?.foundationManifest?.cards?.find(item=>item.realmId===card?.id)?.conditionId;
 return id?plan(card,d.foundationManifest.seed,id):null;
}
function travelSurcharge(card,d,path){
 const p=forDungeon(card,d);
 if(!p||p.id!=='veiled_passages'||!Array.isArray(path)||path.length<2)return 0;
 const used=new Set(d.conditionEdgesUsed||[]),marked=new Set(p.edges);
 let additional=0;
 for(let i=1;i<path.length;i++){const key=edgeId(path[i-1],path[i]);if(marked.has(key)&&!used.has(key)){used.add(key);additional++;}}
 return additional*get('veiled_passages').params.firstPassExtraSteps;
}
function forDungeon(card,d){
 const meta=d?.foundationManifest?.cards?.find(m=>m.realmId===card?.id);
 return meta?plan(card,d.foundationManifest.seed,meta.conditionId):null;
}
function markTraversed(card,d,path){
 const p=forDungeon(card,d);
 if(!p||p.id!=='veiled_passages')return 0;
 if(!Array.isArray(d.conditionEdgesUsed))d.conditionEdgesUsed=[];
 const before=d.conditionEdgesUsed.length,marked=new Set(p.edges);
 for(let i=1;i<path.length;i++){const key=edgeId(path[i-1],path[i]);if(marked.has(key)&&!d.conditionEdgesUsed.includes(key))d.conditionEdgesUsed.push(key);}
 return d.conditionEdgesUsed.length-before;
}
function validLedger(card,d){
 if(!Array.isArray(d?.conditionEdgesUsed)||new Set(d.conditionEdgesUsed).size!==d.conditionEdgesUsed.length)return false;
 const p=forDungeon(card,d);
 return !!p&&(p.id==='veiled_passages'?d.conditionEdgesUsed.every(x=>p.edges.includes(x)):d.conditionEdgesUsed.length===0);
}
function countFor(selected,card,d){
 const p=forDungeon(card,d);
 if(p?.id==='carrion_swarm'&&p.rooms.includes(selected.node))return p.counts[selected.node];
 return selected.mobCount||3;
}
function applyEncounter(run,enemies,selected,card,d){
 const p=forDungeon(card,d);
 if(!run||!Array.isArray(enemies)||!enemies.length||!p)return null;
 run.conditionId=p.id;
 run.conditionMarked=p.rooms.includes(selected.node);
 run.conditionBoss=!!selected.boss;
 run.conditionRiteTriggered=false;
 const q=get(p.id).params;
 if(p.id==='relentless_hunt'&&run.conditionMarked){
  for(const enemy of enemies)enemy.attackEvery=Math.max(.15,enemy.attackEvery/q.attackSpeedMult);
 }else if(p.id==='blighted_ground'&&run.conditionMarked){
  run.conditionHealingMult=q.healingReceivedMult;
 }else if(p.id==='unbroken_ward'&&selected.boss){
  const boss=enemies.find(e=>e.boss);
  if(boss){const awarded=Math.max(1,Math.round(boss.maxhp*q.bossBarrierMaxHpPct));boss.barrier=(boss.barrier||0)+awarded;run.conditionBarrierGranted=awarded;}
 }
 return p;
}
function healingFactor(run){return run?.conditionId==='blighted_ground'&&run.conditionMarked?get('blighted_ground').params.healingReceivedMult:1;}
function tick(run){
 if(run?.conditionId!=='sanguine_rite'||!run.conditionBoss||run.conditionRiteTriggered||run.status!=='fight')return false;
 const boss=run.enemies?.find(e=>e?.boss)||run.enemy?.boss&&run.enemy;
 if(!boss||boss.hp<=0||boss.hp>=boss.maxhp*get('sanguine_rite').params.bossHpThreshold)return false;
 const p=get('sanguine_rite').params;
 boss.atk=Math.max(1,Math.round(boss.atk*p.attackMult));
 boss.attackEvery=Math.max(.15,boss.attackEvery/p.attackSpeedMult);
 run.conditionRiteTriggered=true;
 return true;
}
const API=Object.freeze({GUIDE,get,edgeId,plan,forGame,forDungeon,travelSurcharge,markTraversed,validLedger,countFor,applyEncounter,healingFactor,tick});
root.WandererV013ExpeditionConditions=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
