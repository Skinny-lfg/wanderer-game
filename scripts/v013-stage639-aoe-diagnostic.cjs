'use strict';
// Stage6.39: fresh native AoE/normal/Elite/Boss audit with 500 real E1-born
// agents, no manufactured talents, equipment or unlocked Expeditions.
const fs=require('node:fs'),path=require('node:path');
const N=require('./v013-natural-progression.cjs');
const B=require('./v013-stage632-player-power.cjs');
const V=require('./v013-stage637-natural-rates.cjs');
const R=require('./v013-stage634-natural-rates.cjs');
const S=require('./simulate-progression.cjs');
const ELITES=[...V.E];
const BOSSES=['leech','matriarch','devourer','guardian','berserker','conductor'];
const LEVELS=[1,2,3,4,5];
const BASELINE={run:45210902220,stage:'6.38',accounts:500,reachedE2:241,reachedE5:178,
 E1:{solo:96.1,small:43.1,swarm:13.7,elite:65.9,boss:36.7},
 E5:{solo:100,small:81.3,swarm:67.9,elite:99,boss:97.2}};
function options(args=process.argv.slice(2)){
 const defaults={mode:'cohort',batch:0,seed:9861,take:5,maxLevel:5,
  maxAttempts:12,maxTotalAttempts:60,out:'reports/v013-stage639-diagnostic-0-9861.json',
  inputs:'reports/stage639-shards'};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Invalid Stage639 option '+arg);
  const k=m[1],v=m[2];
  if(['mode','out','inputs'].includes(k))defaults[k]=v;
  else if(['batch','seed','take','max-level','max-attempts','max-total-attempts'].includes(k))
   defaults[k.replace(/-([a-z])/g,(_,ch)=>ch.toUpperCase())]=Number(v);
  else throw Error('Unsupported Stage639 flag '+k);
 }
 if(!['cohort','aggregate'].includes(defaults.mode)||
  !/^reports\/v013-stage639-[a-z0-9-]+\.json$/.test(defaults.out)||
  !/^reports\/[a-z0-9/-]+$/.test(defaults.inputs)||defaults.inputs.includes('..'))
  throw Error('Unsafe Stage639 path');
 if(defaults.mode==='cohort'&&(!Number.isInteger(defaults.batch)||defaults.batch<0||defaults.batch>=20||
  !B.SEEDS.includes(defaults.seed)||!Number.isInteger(defaults.take)||defaults.take<1||defaults.take>5||
  !Number.isInteger(defaults.maxLevel)||defaults.maxLevel<1||defaults.maxLevel>5||
  !Number.isInteger(defaults.maxAttempts)||defaults.maxAttempts<1||defaults.maxAttempts>12||
  !Number.isInteger(defaults.maxTotalAttempts)||defaults.maxTotalAttempts<1||defaults.maxTotalAttempts>60))
  throw Error('Unsafe Stage639 natural account limits');
 return defaults;
}
const packRoom=(a,r)=>({
 E:a.level,attempt:a.attempt,kind:r.kind,enemies:r.initialEnemies,
 initialMinions:r.initialMinions,initialNormals:r.initialNormals,
 initialRoleCounts:r.initialRoleCounts,
 win:r.won,death:r.died,timeout:!!r.timedOut,seconds:r.seconds||0,
 eliteType:r.eliteType||null,bossStyle:r.bossStyle||null,
 aoePotential:!!r.aoePotential,aoeTalentIds:r.aoeTalentIds||[],
 actualWeapon:r.actualWeapon||null,actualOffhand:r.actualOffhand||null,
 actualElement:r.actualElement||null,
 secondaryTargetDamage:r.secondaryTargetDamage||0,
 secondaryTargetHits:r.secondaryTargetHits||0,
 observedNonFocusedHealthLost:r.observedNonFocusedHealthLost||0,
 observedHealthLostByRole:r.observedHealthLostByRole||null,
 damageTaken:r.damageTaken||0,damageDealt:r.damageDealt||0,
 hpStart:r.hpStart,hpEnd:r.hpEnd,hpMax:r.hpMax,minHpPct:r.minHpPct,
 peakLiveEnemies:r.peakLiveEnemies,enemyAbilityCasts:r.enemyAbilityCasts||0
});
function cohort(cfg){
 if(B.IDS.length!==100||B.SEEDS.length!==5||B.BATCHES.length!==20)throw Error('Stage639 catalog drift');
 const accounts=[];
 for(const id of B.BATCHES[cfg.batch].slice(0,cfg.take)){
  const profile=B.PROFILES[id];
  const natural=N.simulateAccount(cfg.seed,id,{
   ...N.DEFAULTS,seeds:[cfg.seed],profiles:[id],maxLevel:cfg.maxLevel,
   maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts
  },{researchProfiles:B.PROFILES,decisionModel:'adaptive'});
  const acc=R.summaryAccount(natural,id,profile,cfg.seed);
  const actual=natural.attempts.flatMap(a=>(a.rooms||[]).map(r=>packRoom(a,r)));
  if(acc.rooms.length!==actual.length||
    actual.some((r,i)=>r.E!==acc.rooms[i].E||r.enemies!==acc.rooms[i].enemies||
     r.kind!==acc.rooms[i].kind||r.win!==acc.rooms[i].win))
   throw Error('Native AoE room trace does not match Stage637 legal summary '+id);
  if(actual.some(r=>r.kind==='elite'&&!ELITES.includes(r.eliteType)||
                      r.kind==='boss'&&!BOSSES.includes(r.bossStyle)))
   throw Error('Unknown native Elite/Boss identity during AoE audit '+id);
  accounts.push({...acc,rooms:actual});
  console.log('STAGE639_ACCOUNT='+JSON.stringify({
   id,seed:cfg.seed,E:acc.endLevel,rooms:actual.length,
   aoePotentialGroups:actual.filter(x=>x.enemies>1&&x.aoePotential).length
  }));
 }
 return {stage:'6.39',kind:'cohort',source:S.sourceFingerprint().sha256,
  settings:cfg,complete:cfg.take===5&&cfg.maxLevel===5&&cfg.maxAttempts===12&&cfg.maxTotalAttempts===60,
  accounts,errors:0};
}
function average(xs){return xs.length?Number((xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(3)):null;}
function byRooms(rooms){
 const data=V.rate(rooms);
 return {...data,aoePotential:rooms.filter(x=>x.aoePotential).length,
  observedAoERooms:rooms.filter(x=>x.secondaryTargetDamage>0).length,
  meanSecondaryDamage:average(rooms.map(x=>x.secondaryTargetDamage)),
  meanNonFocusHpLoss:average(rooms.map(x=>x.observedNonFocusedHealthLost)),
  meanDamageTaken:average(rooms.map(x=>x.damageTaken)),
  meanDuration:average(rooms.filter(x=>x.win).map(x=>x.seconds))};
}
const counts=Object.freeze({solo:r=>r.enemies===1,small:r=>r.enemies>=2&&r.enemies<=4,swarm:r=>r.enemies>=5});
function aggregate(shards){
 const ok=V.aggregate(shards.map(s=>{
  if(s.stage!=='6.39')throw Error('Wrong Stage639 shard');
  return {...s,stage:'6.37'};
 }));
 const accounts=shards.flatMap(s=>s.accounts),seen=new Set(accounts.map(a=>a.id+'|'+a.seed));
 if(accounts.length!==500||seen.size!==500)throw Error('500 distinct native AoE accounts required');
 const levels=LEVELS.map(E=>{
  const reached=accounts.filter(a=>a.reached.includes(E));
  const all=reached.flatMap(a=>a.rooms.filter(x=>x.E===E));
  const normals=all.filter(x=>x.kind==='combat');
  return {E,accountsReached:reached.length,allNormal:byRooms(normals),
   groups:Object.fromEntries(Object.entries(counts).map(([name,fn])=>{
    const x=normals.filter(fn);
    return [name,{all:byRooms(x),aoe:byRooms(x.filter(r=>r.aoePotential)),
     noAoe:byRooms(x.filter(r=>!r.aoePotential)),
     observedSecondary:byRooms(x.filter(r=>r.secondaryTargetDamage>0)),
     noObservedSecondary:byRooms(x.filter(r=>r.secondaryTargetDamage===0)),
     byWeapon:Object.fromEntries([...new Set(x.map(r=>r.actualWeapon||'unknown'))]
      .map(w=>[w,byRooms(x.filter(r=>(r.actualWeapon||'unknown')===w))]))
    }];
   })),
   byBoss:Object.fromEntries(BOSSES.map(id=>[id,byRooms(all.filter(r=>r.bossStyle===id&&r.kind==='boss'))])),
   byElite:Object.fromEntries(ELITES.map(id=>[id,byRooms(all.filter(r=>r.eliteType===id&&r.kind==='elite'))])),
   byAffinity:Object.fromEntries(V.F.map(f=>{
    const sub=reached.filter(a=>a.family===f).flatMap(a=>a.rooms.filter(r=>r.E===E));
    return [f,{accounts:reached.filter(a=>a.family===f).length,
     normal:byRooms(sub.filter(r=>r.kind==='combat')),
     elite:byRooms(sub.filter(r=>r.kind==='elite')),
     boss:byRooms(sub.filter(r=>r.kind==='boss'))}];
   }))};
 });
 return {stage:'6.39',kind:'aggregate',source:ok.source,cohort:{accounts:500,profiles:100,
  seeds:B.SEEDS,legitimateE2:levels[1].accountsReached,legitimateE5:levels[4].accountsReached},
  levels,baseline:BASELINE,caveats:[
   'All fights and gear are genuine E1-born native progression; E2–E5 only if actually unlocked.',
   'AoE potential is assessed from ACTUALLY EQUIPPED weapon + ACTUALLY EARNED Talent nodes before each fight, not chosen character name.',
   'AoE potential with zero observed secondary damage is not proof that the player failed to cast: enemy composition, mana, elapsed time, targeting and cooldowns may prevent activation.',
   'AoE versus no-AoE NATURAL comparisons are observational and confounded by gear, talents, class, advancement and room selection; do not assign causal advantage.',
   'Observed direct secondary damage counts real groupSecondaryDamage only, not DoT spread, prepared skill AoE, or indirect effects. Non-focused HP loss also tracks observed net damage but is not source-attributed.',
   'Elite/Boss identity rates have optional room selection and repeated-encounter dependence. 500 agents are heuristic, not random human players.',
   'Historical Stage6.38 run was a different game source. Contrast is descriptive, not matched native causal proof.'
  ]};
}
const fmt=r=>r.resolved?r.wins+'/'+r.resolved+' ('+r.winPct+'%)':'—';
function markdown(d){
 const out=['# Stage 6.39 — real AoE builds, solo normals, eight Elites & six Bosses','',
  'Native source fingerprint '+d.source,'',
  '500 E1-born accounts; E2 legitimately unlocked '+d.cohort.legitimateE2+
   '; E5 legitimately unlocked '+d.cohort.legitimateE5,'',
  '| E | Solo | Small 2–4 | Swarm 5+ | Elite | Boss |',
  '|--:|---|---|---|---|---|'];
 for(const r of d.levels){
  const old=r.E===1?d.baseline.E1:r.E===5?d.baseline.E5:null;
  const solo=r.groups.solo.all,small=r.groups.small.all,swarm=r.groups.swarm.all;
  const el=byRooms([]),overall=null;
  const rr=[...r.byElite?Object.values(r.byElite):[]];
  const allElite={wins:rr.reduce((v,x)=>v+x.wins,0),resolved:rr.reduce((v,x)=>v+x.resolved,0)};
  const bosses=Object.values(r.byBoss);const allBoss={wins:bosses.reduce((v,x)=>v+x.wins,0),resolved:bosses.reduce((v,x)=>v+x.resolved,0)};
  const form=x=>x.resolved?x.wins+'/'+x.resolved+' ('+Number((100*x.wins/x.resolved).toFixed(1))+'%)':'—';
  out.push('| E'+r.E+' | '+[solo,small,swarm].map(fmt).join(' | ')+' | '+form(allElite)+' | '+form(allBoss)+' |');
 }
 out.push('','## Actual AoE-capable versus not, by native group size (observational)','',
 '| E | Group | AoE potential | No AoE | Observed mean secondary target damage / fight |',
 '|--:|---|---|---|---:|');
 for(const r of d.levels)for(const k of ['small','swarm']){
  const g=r.groups[k],n=g.aoe,g0=g.noAoe;
  out.push('| E'+r.E+' | '+k+' | '+fmt(n)+' | '+fmt(g0)+' | '+
   (g.all.meanSecondaryDamage??'—')+' |');
 }
 out.push('','## Named Elites (natural resolved fights)','',
 '| Enemy | E1 | E2 | E3 | E4 | E5 |','|---|---|---|---|---|');
 for(const id of ELITES)out.push('| '+id+' | '+d.levels.map(r=>fmt(r.byElite[id])).join(' | ')+' |');
 out.push('','## Boss style (actual native Boss identity)','',
 '| Boss | E1 | E2 | E3 | E4 | E5 |','|---|---|---|---|---|');
 for(const id of BOSSES)out.push('| '+id+' | '+d.levels.map(r=>fmt(r.byBoss[id])).join(' | ')+' |');
 out.push('','## Limits','',...d.caveats.map(x=>'- '+x),'');
 return out.join('\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=options(argv),result=cfg.mode==='cohort'?cohort(cfg):aggregate(
  fs.readdirSync(cfg.inputs).filter(n=>/^v013-stage639-diagnostic-\d+-\d+\.json$/.test(n))
   .map(n=>JSON.parse(fs.readFileSync(path.join(cfg.inputs,n),'utf8'))));
 fs.mkdirSync(path.dirname(cfg.out),{recursive:true});
 fs.writeFileSync(cfg.out,JSON.stringify(result,null,2)+'\n');
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(result)+'\n');
 console.log('STAGE639='+JSON.stringify(cfg.mode==='aggregate'?result.cohort:
  {n:result.accounts.length,complete:result.complete,seed:cfg.seed,batch:cfg.batch}));
 return result;
}
module.exports={LEVELS,ELITES,BOSSES,BASELINE,options,cohort,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE639_ERROR '+String(e.stack||e));process.exitCode=1;}}
