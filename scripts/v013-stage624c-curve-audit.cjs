'use strict';
// Stage 6.24C — same native hero, seed, legal v15 Talents, native Rare gear,
// Realm and Risk. Only Expedition progression policy differs in the test VM.
// This is a CONTROLLED, NOT an earned E200 account. No published game writes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const H=require('./v013-stage615-enemy-hierarchy.cjs');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const P=globalThis.WandererExpeditionProgression;
const root=path.resolve(__dirname,'..');
const IDS=Object.freeze(Object.keys(P.ELITE_GROWTH));
const LEVELS=Object.freeze([5,15,35,70,100,200]);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const live=fs.readFileSync(path.join(root,'combat/expedition-progression.js'),'utf8');
const LEGACY_ELITE_GAINS=Object.freeze({
 tank:{hp:.42,atk:.18,def:.08,lateHp:.16,lateAtk:.06,lateDef:.02},
 berserker:{hp:.38,atk:.17,def:.04,lateHp:.22,lateAtk:.11,lateDef:.02},
 vampire:{hp:.20,atk:.10,def:.02,lateHp:.28,lateAtk:.14,lateDef:.03},
 caster:{hp:.52,atk:.22,def:.08,lateHp:.18,lateAtk:.10,lateDef:.03},
 gravecaller:{hp:.35,atk:.15,def:.05,lateHp:.34,lateAtk:.22,lateDef:.04},
 the_shepherd:{hp:.62,atk:.27,def:.12,lateHp:.35,lateAtk:.18,lateDef:.06},
 the_gilded:{hp:.73,atk:.30,def:.10,lateHp:.50,lateAtk:.20,lateDef:.06},
 the_headsman:{hp:.55,atk:.23,def:.08,lateHp:.25,lateAtk:.14,lateDef:.03}
});
// Executed only inside the disposable native VM via source function text.
function legacyEnemyScaling(level,kind,identity=null){
 checked(level);
 if(kind==='normal')return UNITY;
 if(kind==='boss'){
  const p=BOSS_PROTECTION[identity];
  if(!p)throw Error('Invalid Boss scaling style '+identity);
  const phase=Math.max(0,Math.min(1,(30-level)/29));
  return {hp:1-p.hp*phase,atk:1-p.atk*phase,def:1};
 }
 if(kind==='elite'){
  const g=LEGACY_ELITE_GAINS[identity];
  if(!g)throw Error('Invalid Elite scaling identity '+identity);
  const a=Math.max(0,Math.min(1,(level-5)/30));
  const b=Math.max(0,Math.min(1,(level-35)/35));
  return {hp:1+g.hp*a+g.lateHp*b,
   atk:1+g.atk*a+g.lateAtk*b,
   def:1+g.def*a+g.lateDef*b};
 }
 throw Error('Invalid native enemy class '+kind);
}
function baselineSource(){
 const a=live.indexOf('function enemyScaling('),b=live.indexOf('\nroot.WandererExpeditionProgression=',a);
 if(a<0||b<0||live.indexOf('function enemyScaling(',a+1)!==-1||
   !live.slice(a,b).includes('eliteProgress(level)')||
   !live.slice(a,b).includes('BOSS_PROTECTION[identity]'))
  throw Error('Stage 6.24C native progression changed; refuse stale A/B');
 const old="const LEGACY_ELITE_GAINS="+JSON.stringify(LEGACY_ELITE_GAINS)+";\n"+
  legacyEnemyScaling.toString().replace('function legacyEnemyScaling','function enemyScaling');
 const out=live.slice(0,a)+old+live.slice(b);
 new Function(out);
 return out;
}
const BASELINE=baselineSource();
const SOURCES=Object.freeze({before:sha(BASELINE),after:sha(live)});
function plan(level){
 if(!LEVELS.includes(level))throw Error('Unsupported Stage 6.24C level');
 const rows=H.plan({...H.DEFAULTS,seedsPerCell:1,seedStart:6240001});
 const match=level>=70?70:level;
 const group=rows.rows.filter(x=>x.level===match).map(x=>
  ({...x,level,seed:x.seed+(level===100?510000:level===200?910000:0),id:x.id+'-E'+level}));
 if(group.length!==12||group.some(x=>!T.valid(x.talents)||T.earned(x.talents)!==x.budget))
  throw Error('Stage 6.24C incomplete legal controlled player cohort '+level);
 return group;
}
function native(row,kind,id,variant){
 const baseline=variant==='before';
 if(!['before','after'].includes(variant))throw Error('Invalid A/B arm');
 const opts={...H.nativeOptions(row,kind,H.DEFAULTS),
  ...(baseline?{stage624cProgressionSource:BASELINE}:{})};
 if(kind==='elite')opts.stage619EliteType=id;
 const fight=S.encounter(row.level,row.build,row.seed,kind,opts,
   undefined,undefined,row.realm,row.risk,kind==='normal'?1:undefined);
 if(fight.timedOut||!fight.won&&!fight.died||fight.nativeEncounter!==kind||
  fight.affinity!==row.realm||fight.level!==row.level||fight.risk!==row.risk||
  fight.pointsBudget!==row.budget||fight.pointsSpent!==row.spent||
  fight.gearRarity!=='Rare'||fight.targetPolicy!=='focus'||
  JSON.stringify(fight.controlledTalentNodes)!==JSON.stringify(row.talents.nodes)||
  kind==='elite'&&fight.eliteType!==id)
  throw Error('Invalid native Stage 6.24C match '+row.id+'/'+kind+'/'+id+'/'+variant);
 return {won:!!fight.won,died:!!fight.died,damageTaken:fight.damageTaken,
  seconds:fight.seconds,hpStart:fight.hpStart,mpStart:fight.mpStart,
  hpMax:fight.hpMax,mpMax:fight.mpMax,gear:fight.gearFingerprint,
  seed:fight.resolvedSeed,condition:fight.plannedConditionId,
  roster:fight.roster.map(e=>({role:e.role,maxHp:e.maxHp,atk:e.attack,def:e.defense})),
  bossId:fight.bossId,eliteType:fight.eliteType,affinity:fight.affinity};
}
function compare(row,kind,id){
 const before=native(row,kind,id,'before'),after=native(row,kind,id,'after');
 const parities={
  gear:before.gear===after.gear,
  player:before.hpStart===after.hpStart&&before.mpStart===after.mpStart&&
    before.hpMax===after.hpMax&&before.mpMax===after.mpMax,
  seed:before.seed===after.seed,condition:before.condition===after.condition,
  identity:before.eliteType===after.eliteType&&before.bossId===after.bossId&&
    before.affinity===after.affinity&&before.roster[0]?.role===after.roster[0]?.role,
  classified:before.roster.length===after.roster.length,
  nonEliteUnchanged:kind==='elite'||kind==='boss'&&row.level>30||JSON.stringify(before)===JSON.stringify(after),
  e5Exact:row.level!==5||JSON.stringify(before)===JSON.stringify(after)
 };
 if(Object.values(parities).some(v=>!v))throw Error('Native matched invariants fail '+row.id+'/'+kind+'/'+id+': '+JSON.stringify(parities));
 return {kind,id,row:row.id,realm:row.realm,role:after.roster[0]?.role||null,
  old:before,new:after};
}
function evaluate(level){
 const rows=plan(level),all=[];
 for(const row of rows){
  all.push(compare(row,'normal','solo'));
  for(const id of IDS)all.push(compare(row,'elite',id));
  all.push(compare(row,'boss',row.realm));
 }
 if(all.length!==rows.length*(IDS.length+2))throw Error('Missing A/B fights');
 return {stage:'6.24C',mode:'level',level,
  sources:SOURCES,gameSource:S.sourceFingerprint().sha256,
  provenance:'native controlled legal gear and talents, NOT earned E'+level,
  coverage:{heroes:rows.length,pairs:all.length,fights:all.length*2,errors:0},
  rows:all};
}
const med=a=>{const v=a.filter(Number.isFinite).sort((x,y)=>x-y),m=v.length>>1;return !v.length?null:v.length%2?v[m]:(v[m-1]+v[m])/2;};
function outcome(rows){
 const n=rows.length,a=rows.filter(x=>x.old.won).length,b=rows.filter(x=>x.new.won).length;
 return {n,oldWins:a,newWins:b,oldPct:n?Math.round(1000*a/n)/10:null,
  newPct:n?Math.round(1000*b/n)/10:null,
  oldDamage:med(rows.map(x=>x.old.damageTaken)),newDamage:med(rows.map(x=>x.new.damageTaken)),
  oldHP:med(rows.map(x=>x.old.roster[0]?.maxHp)),newHP:med(rows.map(x=>x.new.roster[0]?.maxHp))};
}
function summarize(shards){
 const levels=new Set(),a=[],data=[];
 for(const shard of shards){
  if(shard.stage!=='6.24C'||shard.mode!=='level'||levels.has(shard.level)||
   JSON.stringify(shard.sources)!==JSON.stringify(SOURCES)||shard.coverage.errors||
   shard.coverage.heroes!==12||shard.rows.length!==120)
   throw Error('Invalid Stage 6.24C complete shard');
  levels.add(shard.level);data.push(shard);
  const elves=shard.rows.filter(r=>r.kind==='elite');
  a.push({E:shard.level,
   heroSets:shard.coverage.heroes,
   elites:outcome(elves),
   byElite:Object.fromEntries(IDS.map(id=>[id,outcome(elves.filter(x=>x.id===id))])),
   normal:outcome(shard.rows.filter(x=>x.kind==='normal')),
   bosses:outcome(shard.rows.filter(x=>x.kind==='boss')),
   byBoss:Object.fromEntries(['blood','decay','radiance','aegis','fury','arcane']
    .map(f=>[f,outcome(shard.rows.filter(x=>x.kind==='boss'&&x.realm===f))]))});
 }
 if(levels.size!==LEVELS.length||LEVELS.some(x=>!levels.has(x)))throw Error('Incomplete E5-E200 native audit');
 return {stage:'6.24C',mode:'aggregate',sources:SOURCES,
  coverage:{levels:LEVELS,heroes:data.reduce((n,x)=>n+x.coverage.heroes,0),
   pairs:data.reduce((n,x)=>n+x.coverage.pairs,0),
   fights:data.reduce((n,x)=>n+x.coverage.fights,0),errors:0,allNativeMatched:true},
  results:a.sort((x,y)=>x.E-y.E)};
}
function main(argv=process.argv.slice(2)){
 let mode='level',level=5,output='reports/stage624c-level5.json',dir='reports/stage624c-shards';
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid Stage 6.24C CLI');
  if(m[1]==='mode')mode=m[2];
  else if(m[1]==='level')level=Number(m[2]);
  else if(m[1]==='out')output=m[2];
  else if(m[1]==='inputs')dir=m[2];
  else throw Error('Invalid Stage 6.24C option '+m[1]);
 }
 if(!output.startsWith('reports/')||output.includes('..')||!output.endsWith('.json'))throw Error('Invalid report path');
 let result;
 if(mode==='level')result=evaluate(level);
 else if(mode==='aggregate'){
  if(!dir.startsWith('reports/')||dir.includes('..'))throw Error('Invalid shard directory');
  const paths=fs.readdirSync(path.join(root,dir)).filter(x=>/^stage624c-level\d+\.json$/.test(x));
  result=summarize(paths.map(f=>JSON.parse(fs.readFileSync(path.join(root,dir,f),'utf8'))));
 }else throw Error('Unsupported Stage 6.24C mode');
 fs.mkdirSync(path.dirname(path.join(root,output)),{recursive:true});
 fs.writeFileSync(path.join(root,output),JSON.stringify(result,null,2)+'\n');
 const message=result.mode==='level'?{E:result.level,coverage:result.coverage}:
  {coverage:result.coverage,results:result.results};
 console.log('STAGE624C='+JSON.stringify(message));
 return result;
}
module.exports={IDS,LEVELS,SOURCES,BASELINE,baselineSource,plan,native,compare,evaluate,outcome,summarize,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE624C_ERROR '+(e.stack||e));process.exitCode=1;}}
