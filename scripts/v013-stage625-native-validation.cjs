'use strict';
// Stage 6.25 — diagnostic native player/enemy encounters. No gameplay writes.
// E35/E70/E200 are CONTROLLED legal Talent v15 + native Rare/Epic rolls.
// E200 uses full 100-point legal v15 builds, but never claims earned E200 XP.
const fs=require('node:fs'), path=require('node:path');
const H=require('./v013-stage615-enemy-hierarchy.cjs');
const L=require('./v013-stage611-legal-adaptive.cjs');
const B=require('./v013-build-planner.cjs');
const crypto=require('node:crypto');
const S=require('./simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const P=globalThis.WandererExpeditionProgression;
const LEVELS=[35,70,200], RARITIES=['Rare','Epic'];
const IDS=Object.keys(P.ELITE_GROWTH);
const FAMILIES=H.FAMILIES;
const pct=(n,d)=>d?+(100*n/d).toFixed(1):null;
const median=(items)=>{const a=items.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return null;const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;};
function fullTalentBuild(row){
 if(T.MAX_POINTS!==100||!row.sourceArchetype.startsWith('profile:'))
  throw Error('Stage 6.25 needs the native 100-point strategic Talent Tree');
 const id=row.sourceArchetype.slice('profile:'.length),plan=B.getPlan(id);
 const profile=L.profileCandidate(id,T.MAX_POINTS,{
  pressure:plan.model==='adaptive'&&T.MAX_POINTS>=(plan.thirdAt||1000)});
 const talents={xp:T.MAX_POINTS*T.POINT_XP,nodes:[...profile.actualNodes],treeVersion:15};
 if(profile.mode!=='arcane')talents.element=profile.mode;
 const byId=new Map(T.NODES.map(n=>[n.id,n]));
 const advanced=talents.nodes.filter(id=>byId.get(id.replace(/_rank\d+$/,''))?.advanced);
 if(advanced.length)talents.prepared=(plan.milestones||[]).find(id=>advanced.includes(id))||advanced.at(-1);
 if(!T.valid(talents)||T.earned(talents)!==100||talents.nodes.length<=60||
  profile.spent!==talents.nodes.length)
  throw Error('Invalid or underinvested native 100-point Talent allocation '+id);
 return {...row,budget:100,spent:talents.nodes.length,talents,
  talentHash:crypto.createHash('sha256').update(JSON.stringify({
   nodes:talents.nodes,mode:profile.mode,prepared:talents.prepared||null})).digest('hex')};
}
function options(level,rarity,seedStart=6250031,seedsPerCell=4,points=level===200?100:undefined){
 if(!LEVELS.includes(level)||!RARITIES.includes(rarity))throw Error('Invalid stage625 cohort');
 const budget=level===35?36:level===70?60:points;
 if(level===200? ![60,100].includes(budget):points!==undefined)
  throw Error('Invalid stage625 level/point budget');
 const settings={...H.DEFAULTS,mode:'matrix',budgets:[level===35?36:60],
  seedStart,seedsPerCell,rarity,risk:1,tickLimit:6500};
 const planned=H.plan(settings);
 const rows=planned.rows.map(r=>{
  if(level!==200)return r;
  const row={...r,id:r.id+'-E200-P'+budget,level,seed:r.seed+500000};
  return budget===100?fullTalentBuild(row):row;
 });
 if(rows.length!==12*seedsPerCell||rows.some(r=>r.level!==level||
    r.budget!==budget||!T.valid(r.talents)||T.earned(r.talents)!==r.budget))
   throw Error('Illegal/partial stage625 cohort');
 return {settings,rows,pointsBudget:budget};
}
function native(row,settings,kind,id=null,count=null){
 const opts={...H.nativeOptions(row,kind,settings)};
 if(kind==='elite')opts.stage619EliteType=id;
 const x=S.encounter(row.level,row.build,row.seed,kind,opts,undefined,undefined,
  row.realm,row.risk,kind==='normal'?count:undefined);
 if(x.timedOut||x.won===x.died||!Number.isFinite(x.damageTaken)||
    x.nativeEncounter!==kind||x.level!==row.level||
    x.affinity!==row.realm||x.risk!==row.risk||
    x.pointsBudget!==row.budget||x.pointsSpent!==row.spent||
    x.gearRarity!==settings.rarity||
    JSON.stringify(x.controlledTalentNodes)!==JSON.stringify(row.talents.nodes)||
    kind==='elite'&&x.eliteType!==id||
    kind==='normal'&&x.initialEnemies!==count)
   throw Error('Invalid native combat: '+row.id+'/'+kind+'/'+id+'/'+count);
 const leader=x.roster[0]||{};
 return {kind,id:kind==='elite'?id:kind==='boss'?row.realm:'group-'+count,
  count:kind==='normal'?count:null,won:x.won,seconds:x.seconds,
  damageTaken:x.damageTaken,damageDealt:x.damageDealt,
  hpStart:x.hpStart,hpMax:x.hpMax,mpStart:x.mpStart,mpMax:x.mpMax,
  gearFingerprint:x.gearFingerprint,resolvedSeed:x.resolvedSeed,
  conditionId:x.plannedConditionId,affinity:x.affinity,
  rarity:x.gearRarity,points:x.pointsSpent,eliteType:x.eliteType,
  bossId:x.bossId,initialRoles:x.initialRoles,
  bossSummons:x.bossSummons,eliteSummons:x.eliteSummons,
  leaderHp:leader.maxHp??null,leaderAtk:leader.attack??null,
  roles:x.roster.map(e=>e.role)};
}
function measure(level,rarity,seedsPerCell=4,points=level===200?100:undefined){
 const {settings,rows,pointsBudget}=options(level,rarity,6250031,seedsPerCell,points);
 const trials=[];
 for(const row of rows){
  const baseline=native(row,settings,'normal',null,1);
  const trial=[baseline];
  for(const count of [3,6,12])trial.push(native(row,settings,'normal',null,count));
  for(const id of IDS)trial.push(native(row,settings,'elite',id));
  trial.push(native(row,settings,'boss'));
  if(trial.length!==13)throw Error('Invalid stage625 opponent matrix');
  for(const x of trial){
   if(x.gearFingerprint!==baseline.gearFingerprint||
    x.hpMax!==baseline.hpMax||x.mpMax!==baseline.mpMax||
    x.hpStart!==baseline.hpStart||x.mpStart!==baseline.mpStart||
    x.resolvedSeed!==baseline.resolvedSeed||
    x.conditionId!==baseline.conditionId)
    throw Error('Different native hero/seed/condition: '+row.id+'/'+x.kind+'/'+x.id);
  }
  trials.push({id:row.id,seed:row.seed,realm:row.realm,
   archetype:row.sourceArchetype,aligned:row.aligned,
   budget:row.budget,armor:row.gear.armor,weapon:row.gear.weapon,
   offhand:row.gear.offhand,gearFingerprint:baseline.gearFingerprint,fights:trial});
 }
 return {stage:'6.25',kind:'native-controlled-not-earned',level,rarity,pointsBudget,
  source:S.sourceFingerprint().sha256,
  notes:['Genuine native enemy AI/HP/ATK, real game gear rolls and legally allocated v15 Talents.',
   'Controlled high-level Expedition access, synthetic XP/gear, no earned E35/E200 hero.',
   'E200 uses the full 100-point legal v15 Talent Tree (or explicit 60-point legacy comparison); XP and access are controlled, not earned.',
   'Boss encounters have no earned preparations/Boons/potions.',
   'Normal groups use naturally generated native roles; a solo normal is not forced to be a Tank.'],
  coverage:{heroes:trials.length,fights:trials.length*13,eliteFights:trials.length*8,
   bossFights:trials.length,normalFights:trials.length*4,errors:0},
  trials,summary:summarize(trials)};
}
function outcome(fights){
 return {n:fights.length,wins:fights.filter(x=>x.won).length,
  winPct:pct(fights.filter(x=>x.won).length,fights.length),
  damageMedian:median(fights.map(x=>x.damageTaken)),
  durationMedian:median(fights.map(x=>x.seconds)),
  leaderHpMedian:median(fights.map(x=>x.leaderHp))};
}
function summarize(trials){
 const fights=trials.flatMap(t=>t.fights.map(f=>({...f,realm:t.realm,archetype:t.archetype,aligned:t.aligned,armor:t.armor})));
 const pick=(kind,id)=>outcome(fights.filter(x=>x.kind===kind&&(id===undefined||x.id===id)));
 return {all:{normalSolo:pick('normal','group-1'),normal3:pick('normal','group-3'),
    normal6:pick('normal','group-6'),normal12:pick('normal','group-12'),
    elites:pick('elite'),bosses:pick('boss')},
  byElite:Object.fromEntries(IDS.map(id=>[id,pick('elite',id)])),
  byBoss:Object.fromEntries(FAMILIES.map(id=>[id,outcome(fights.filter(x=>x.kind==='boss'&&x.realm===id))])),
  byRealm:Object.fromEntries(FAMILIES.map(id=>[id,{
   elites:outcome(fights.filter(x=>x.kind==='elite'&&x.realm===id)),
   boss:outcome(fights.filter(x=>x.kind==='boss'&&x.realm===id)),
   normal12:outcome(fights.filter(x=>x.kind==='normal'&&x.id==='group-12'&&x.realm===id))}])),
  byArmor:Object.fromEntries(['Cloth','Leather','Plate'].map(id=>[id,{
   elites:outcome(fights.filter(x=>x.kind==='elite'&&x.armor===id)),
   bosses:outcome(fights.filter(x=>x.kind==='boss'&&x.armor===id))}])),
  byAlignment:Object.fromEntries(['aligned','cross'].map(id=>[id,{
   elites:outcome(fights.filter(x=>x.kind==='elite'&&x.aligned===(id==='aligned'))),
   bosses:outcome(fights.filter(x=>x.kind==='boss'&&x.aligned===(id==='aligned')))}]))};
}
function aggregate(directory){
 const paths=fs.readdirSync(directory).filter(f=>/^stage625-E(35|70|200)-(Rare|Epic)\.json$/.test(f)).sort();
 const shards=paths.map(f=>JSON.parse(fs.readFileSync(path.join(directory,f),'utf8')));
 const observed=new Set();
 for(const s of shards){
  const key=s.level+'/'+s.rarity;
  if(s.stage!=='6.25'||observed.has(key)||s.coverage.heroes!==48||
    s.coverage.fights!==624||s.coverage.errors||!s.source||s.trials.length!==48||
    s.pointsBudget!==(s.level===35?36:s.level===70?60:100))
   throw Error('Incomplete Stage 6.25 evidence: '+key);
  observed.add(key);
 }
 if(observed.size!==6||shards.some(s=>s.source!==shards[0].source))
  throw Error('Missing 6 shards or engine source disagreement');
 const lines=['# Stage 6.25 — real native combats; controlled v15 Rare / Epic gear',
  '','E200 hero has 100 available Talent points (10,000 synthetic XP), legally allocated in Talent Tree v15, NOT an earned E200 character.',
  'Bosses unprepared and without player Boons, potions, or complete Expedition economy.','',
  '| E | Gear | Talent budget | Normal 1 | Normal 3 | Normal 6 | Normal 12 | Elites | Bosses |',
  '|---:|---|---:|---:|---:|---:|---:|---:|---:|'];
 for(const s of shards){
  const x=s.summary.all,rate=k=>x[k].wins+'/'+x[k].n+' ('+x[k].winPct+'%)';
  lines.push('| '+s.level+' | '+s.rarity+' | '+s.pointsBudget+' | '+rate('normalSolo')+' | '+rate('normal3')+' | '+rate('normal6')+' | '+rate('normal12')+' | '+rate('elites')+' | '+rate('bosses')+' |');
 }
 for(const s of shards){
  lines.push('','## E'+s.level+' '+s.rarity+' — 8 named Elites');
  for(const [id,x] of Object.entries(s.summary.byElite))
   lines.push('- '+id+': '+x.wins+'/'+x.n+' ('+x.winPct+'%)');
  lines.push('','Bosses by Affinity (8 real native samples per Boss):');
  for(const [id,x] of Object.entries(s.summary.byBoss))
   lines.push('- '+id+': '+x.wins+'/'+x.n+' ('+x.winPct+'%)');
 }
 lines.push('','## Interpretation','',
  '- No gameplay parameters were modified. Normal solo and grouped encounters are not a fixed Tank-only benchmark.',
  '- Individual Elite estimates have 48 battles per E and rarity, while each Boss has 8; Boss estimates remain noisy.',
  '- E200 uses 100 available Talent points, native v15 legal allocations, not automatically 100 spent nodes; natural E1–E20 accounts are reported independently.',
  '- Do not auto-buff/nerf from these controlled win rates alone.','');
 return {stage:'6.25',shards:shards.length,source:shards[0].source,
  coverage:{heroes:shards.reduce((n,x)=>n+x.coverage.heroes,0),
   fights:shards.reduce((n,x)=>n+x.coverage.fights,0),errors:0},
  results:shards.map(s=>({level:s.level,rarity:s.rarity,pointsBudget:s.pointsBudget,summary:s.summary})),
  markdown:lines.join('\n')};
}
function main(argv=process.argv.slice(2)){
 const args=Object.fromEntries(argv.map(a=>{const m=/^--([a-z-]+)=(.+)$/.exec(a);if(!m)throw Error('Invalid CLI '+a);return [m[1],m[2]]}));
 const output=args.out||'reports/stage625-results.json';
 if(!output.startsWith('reports/')||output.includes('..')||!output.endsWith('.json'))throw Error('Unsafe report path');
 const data=args['aggregate-dir']?aggregate(args['aggregate-dir']):
  measure(Number(args.level),args.rarity,Number(args.seeds||4),
   args.points===undefined?undefined:Number(args.points));
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n');
 if(args['aggregate-dir'])fs.writeFileSync(output.replace(/\.json$/,'.md'),data.markdown+'\n');
 console.log('STAGE625='+JSON.stringify(args['aggregate-dir']?
  {coverage:data.coverage,results:data.results.map(x=>({E:x.level,rarity:x.rarity,summary:x.summary}))}:
  {E:data.level,rarity:data.rarity,pointsBudget:data.pointsBudget,coverage:data.coverage,summary:data.summary}));
 return data;
}
module.exports={options,native,measure,summarize,aggregate,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE625_ERROR '+(e.stack||e));process.exitCode=1;}}
