'use strict';
// Stage6.31 — one smoothly-compounded enemy curve, E1–E200 (not a fixed %).
// A/B means REAL, independently earned native accounts; old Stage6.30 is VM-only.
// No synthetic XP, gear, Boss victories, or labels for unvisited Expeditions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs');
const P=globalThis.WandererExpeditionProgression;
const hash=s=>crypto.createHash('sha256').update(typeof s==='string'?s:JSON.stringify(s)).digest('hex');
const percentage=(a,n)=>n?Number((100*a/n).toFixed(1)):null;
const CURRENT=fs.readFileSync(path.resolve(__dirname,'../combat/expedition-progression.js'),'utf8');
const BATCHES=Object.freeze({
 'legacy-defense':['cautious','balanced','daring','plate-warden','leather-duelist','cloth-battlemage','hexblade-hybrid'],
 'legacy-casters':['magic-fire','magic-frost','magic-lightning','magic-arcane','magic-wand','magic-staff'],
 'strategic-pure':['smart-blood-pure','smart-fury-pure','smart-magic-arcane-pure','smart-magic-lightning-pure','smart-vitality-pure'],
 'strategic-hybrid':['smart-blood-fury','smart-blood-fury-vitality','smart-blood-fury-vitality-no-mixed','smart-fury-blood-aegis','smart-magic-fire-aegis','smart-magic-frost-vitality','smart-decay-magic-aegis','smart-aegis-vitality'],
 'strategic-weapon':['smart-blood-sword','smart-blood-two-handed','smart-fury-daggers','smart-fury-bow','smart-magic-wand','smart-magic-staff','smart-magic-wand-offense','smart-magic-wand-defense']
});
const DEEP=Object.freeze(['smart-blood-pure','smart-fury-pure','smart-magic-arcane-pure',
 'smart-magic-lightning-pure','smart-vitality-pure','smart-decay-magic-aegis',
 'smart-aegis-vitality','cloth-battlemage','leather-duelist','magic-fire',
 'hexblade-hybrid','smart-blood-fury-vitality']);
const ALL=Object.values(BATCHES).flat();
const TARGETS=Object.freeze({normal:[80,90],elite:[60,70],boss:[35,45]});
const REALMS=D.FAMILIES;
const EARLY=[1,2,3,4,5,6,10,20];
const OLD_REFERENCE=[
 'function enemyReference(level){',
 ' checked(level);',
 ' const earlyRate=.12,rate=.015,weight=2,shoulderLevels=.4;',
 ' if(level<5)return 5*Math.expm1(earlyRate*level)/Math.expm1(5*earlyRate);',
 ' if(level===5)return 5;',
 ' const x=level-5;',
 ' const base=5+Math.log1p(x/5)+weight*(Math.expm1(rate*x)-rate*x);',
 ' const tangent=5*earlyRate*Math.exp(earlyRate*5)/Math.expm1(earlyRate*5);',
 ' const shoulder=(tangent-1/5)*shoulderLevels*(-Math.expm1(-x/shoulderLevels));',
 ' const reference=base+shoulder;',
 " if(!Number.isFinite(reference))throw Error('Expedition enemy reference exceeds finite range at E'+level);",
 ' return reference;',
 '}'
].join('\n');
function oldSource(){
 const a=CURRENT.indexOf('function enemyReference(level){'),b=CURRENT.indexOf('\nconst UNITY=',a);
 if(a<0||b<0||CURRENT.indexOf('function enemyReference(level){',a+1)!==-1||
  !CURRENT.slice(a,b).includes('earlyLogGrowthBoost')||
  !CURRENT.slice(a,b).includes('lateLogGrowth'))
  throw Error('Stage6.31 smooth enemy policy fingerprint drift');
 const src=CURRENT.slice(0,a)+OLD_REFERENCE+CURRENT.slice(b);
 new Function(src);return src;
}
const PREVIOUS=oldSource();
function config(args=process.argv.slice(2)){
 const out={mode:'pilot',batch:'legacy-defense',seed:9861,profile:'cautious',
  maxAttempts:24,maxTotalAttempts:360,trials:1,
  out:'reports/v013-stage631-pilot-legacy-defense-9861.json',inputs:'reports/stage631-shards'};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid Stage6.31 option '+arg);
  const [,key,val]=m;
  if(['mode','batch','profile','out','inputs'].includes(key))out[key]=val;
  else if(['seed','max-attempts','max-total-attempts','trials'].includes(key))
   out[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=Number(val);
  else throw Error('Unsupported Stage6.31 option '+key);
 }
 if(!['pilot','deep','aggregate'].includes(out.mode)||!/^reports\/v013-stage631-[a-z0-9-]+\.json$/.test(out.out))
  throw Error('Unsafe Stage6.31 mode/output');
 if(out.mode==='aggregate'){
  if(!/^reports\/[a-z0-9/-]+$/.test(out.inputs)||out.inputs.includes('..'))
   throw Error('Unsafe Stage6.31 shard path');
  return out;
 }
 if(!Number.isSafeInteger(out.seed)||out.seed<1||out.seed>1000000||
  !Number.isSafeInteger(out.maxAttempts)||out.maxAttempts<1||out.maxAttempts>36||
  !Number.isSafeInteger(out.maxTotalAttempts)||out.maxTotalAttempts<30||out.maxTotalAttempts>400||
  !Number.isSafeInteger(out.trials)||out.trials<1||out.trials>2||
  out.mode==='pilot'&&!BATCHES[out.batch]||
  out.mode==='deep'&&!DEEP.includes(out.profile))
  throw Error('Invalid Stage6.31 simulation inputs');
 return out;
}
function validate(){
 if(ALL.length!==34||new Set(ALL).size!==34||
  DEEP.length!==12||ALL.some(id=>!N.PROFILES[id]))throw Error('Missing native builds');
 const g=P.ENEMY_EXPONENTIAL_GROWTH;
 if(Object.keys(g).sort().join('|')!=='earlyLogGrowthBoost|initialReference|lateLogGrowth|relaxationExpeditions'||
  !Object.values(g).every(x=>Number.isFinite(x)&&x>0))
  throw Error('Native Stage6.31 curve no longer all-positive and smooth');
 for(let E=1;E<200;E++)if(!(P.enemyReference(E+1)>P.enemyReference(E)))
  throw Error('Non-monotonic native reference '+E);
 const changes=[1,2,3,5,6,20,34,35,36,69,70,71,100,150,199,200]
  .map(E=>({E,old:oldValue(E),candidate:P.enemyReference(E),
   growthPct:percentage(P.enemyReference(E+1)-P.enemyReference(E),P.enemyReference(E))}));
 if(!(P.enemyReference(5)<5&&
  Math.abs(P.enemyReference(2)-oldValue(2))<.03&&
  Math.abs(P.enemyReference(3)-oldValue(3))<.03&&
  P.enemyReference(200)>20))
  throw Error('Stage6.31 intended early easing / sustained late growth failed');
 return changes;
}
function oldValue(level){
 const E=level,early=.12;
 if(E<5)return 5*Math.expm1(early*E)/Math.expm1(early*5);
 if(E===5)return 5;
 const x=E-5,base=5+Math.log1p(x/5)+2*(Math.expm1(.015*x)-.015*x);
 const tangent=5*early*Math.exp(early*5)/Math.expm1(early*5);
 return base+(tangent-.2)*.4*(-Math.expm1(-x/.4));
}
function classify(result,profile,seed){
 const errors=result.accounts.flatMap(a=>a.attempts.filter(x=>x.error)
  .map(x=>({level:x.level,attempt:x.attempt,error:x.error})));
 const unexpected=errors.filter(x=>x.error!=='Native combat timeout');
 if(unexpected.length||errors.length!==result.coverage.errors)
  throw Error('Unexpected native failure '+profile+' seed '+seed+': '+JSON.stringify(errors));
 if(result.accounts.length!==1||result.accounts[0].seed!==seed||
  result.accounts[0].profile!==profile)
  throw Error('Agent or seed identity drift');
 return errors;
}
function accountSummary(r){
 const byE=EARLY.map(E=>{
  const attempts=r.attempts.filter(x=>x.level===E);
  const fights=attempts.flatMap(x=>x.rooms||[]);
  const kinds=['combat','elite','boss'];
  return {E,attempts:attempts.length,bossWins:attempts.filter(x=>x.bossWon).length,
   rooms:Object.fromEntries(kinds.map(k=>{
    const a=fights.filter(x=>x.roomType===k),win=a.filter(x=>x.won).length;
    return [k,{n:a.length,wins:win,timeouts:a.filter(x=>x.timedOut).length,
     winRate:percentage(win,a.length)}];
   }))};
 });
 return {profile:r.profile,seed:r.seed,reach:r.endLevel,stop:r.stopReason||null,
  attempts:r.attempts.length,bossWins:r.attempts.filter(x=>x.bossWon).length,
  xp:r.xp,gear:r.finalGear,byE};
}
function nativeAccount(id,seed,cfg,prior){
 const options={...N.DEFAULTS,seeds:[seed],profiles:[id],maxLevel:20,
  maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts};
 const run=N.run(options,{decisionModel:'adaptive',
  ...(prior?{moduleOverrides:{'combat/expedition-progression.js':PREVIOUS}}:{})});
 const errors=classify(run,id,seed);
 return {...accountSummary(run.accounts[0]),nativeTimeouts:errors};
}
function pilot(cfg){
 const accounts=[];
 for(const id of BATCHES[cfg.batch]){
  const before=nativeAccount(id,cfg.seed,cfg,true),after=nativeAccount(id,cfg.seed,cfg,false);
  accounts.push({id,seed:cfg.seed,
   families:N.PROFILES[id].families,armor:N.PROFILES[id].armor,
   plan:N.PROFILES[id].plan||null,before,after});
  console.log('STAGE631_PROGRESS='+JSON.stringify({id,seed:cfg.seed,oldE:before.reach,
   newE:after.reach,oldBossWins:before.bossWins,newBossWins:after.bossWins}));
 }
 return {stage:'6.31',kind:'pilot',settings:cfg,sources:{old:hash(PREVIOUS),new:hash(CURRENT)},
  curve:validate(),accounts,coverage:{accounts:accounts.length*2,
   attempts:accounts.reduce((n,x)=>n+x.before.attempts+x.after.attempts,0),
   timeouts:accounts.reduce((n,x)=>n+x.before.nativeTimeouts.length+x.after.nativeTimeouts.length,0),
   unexpectedErrors:0}};
}
function deep(cfg){
 const opts={seed:cfg.seed,profile:cfg.profile,maxLevel:200,
  maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts,
  trials:cfg.trials,allowNativeCombatTimeouts:true,
  extraCheckpointLevels:[2,3,6,10]};
 const audit=D.audit(opts);
 const byE=audit.checkpoints.map(x=>{
  const fights=audit.matchedFights.filter(y=>y.E===x.level);
  const stat=kind=>{
   const a=fights.filter(y=>y.type===kind),wins=a.filter(y=>y.actual.win).length;
   return {n:a.length,wins,loss:a.filter(y=>y.actual.loss).length,
    timeouts:a.filter(y=>y.actual.timeout).length,winRate:percentage(wins,a.length)};
  };
  return {E:x.level,xp:x.xp,earnedTalents:x.talentEarned,
   investedAttributes:x.attributeSpent,gearRarity:x.equippedRarity,
   equipmentPower:x.statSnapshot.power,normal:stat('normal'),
   elite:stat('elite'),boss:stat('boss'),tank:stat('tank')};
 });
 // At E2/E3/E5, measure each Realm explicitly. Bosses are already measured
 // once per realm by D.audit; repeat normals (1 and 3) and 8 named Elites.
 const byRealm=[];
 for(const snapshot of audit.checkpoints.filter(x=>[2,3,5].includes(x.level))){
  for(const realm of REALMS){
   const scenario=[
    {type:'normal',id:'group-1',size:1,realm},
    {type:'normal',id:'group-3',size:3,realm},
    ...D.ELITES.map(id=>({type:'elite',id,realm}))
   ];
   const fights=scenario.map((one,i)=>{
    const seed=631000+snapshot.seed*103+snapshot.level*997+
     REALMS.indexOf(realm)*79+i*11;
    const r=D.native(snapshot,one,seed);
    return {kind:one.type,identity:one.id,win:!!r.won,loss:!!r.died,
     timeout:!!r.timedOut,heroHp:r.hpMax,
     enemyHp:r.roster.reduce((n,x)=>n+x.maxHp,0)};
   });
   const boss=audit.matchedFights.find(x=>x.E===snapshot.level&&x.type==='boss'&&x.realm===realm);
   if(!boss)throw Error('Missing true native Boss realm '+realm+' E'+snapshot.level);
   fights.push({kind:'boss',identity:'boss-'+realm,win:boss.actual.win,
    loss:boss.actual.loss,timeout:boss.actual.timeout});
   byRealm.push({E:snapshot.level,realm,fights});
  }
 }
 return {stage:'6.31',kind:'deep',settings:cfg,sources:{old:hash(PREVIOUS),new:hash(CURRENT)},
  curve:validate(),account:audit.account,byE,byRealm,naturalBands:audit.naturalWindowDifficulty,
  coverage:{accounts:1,attempts:audit.coverage.nativeAccountAttempts,
   checkpointFights:audit.coverage.encounters,
   perRealmFights:byRealm.reduce((n,r)=>n+r.fights.length,0),
   timeouts:audit.coverage.naturalCombatTimeouts,unexpectedErrors:0}};
}
function aggregate(paths){
 const pilots=[],deep=[],seen=new Set(),seenDeep=new Set();
 for(const filename of paths.sort()){
  const x=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(x.stage!=='6.31'||x.coverage.unexpectedErrors||x.sources.old!==hash(PREVIOUS)||
   x.sources.new!==hash(CURRENT))throw Error('Wrong Stage6.31 source/shard '+filename);
  if(x.kind==='pilot'){
   for(const a of x.accounts){
    const key=a.id+'|'+a.seed;if(seen.has(key))throw Error('Duplicate '+key);
    seen.add(key);pilots.push(a);
   }
  }else if(x.kind==='deep'){
   const key=x.settings.profile+'|'+x.settings.seed;
   if(seenDeep.has(key))throw Error('Duplicate deep '+key);
   seenDeep.add(key);deep.push(x);
  }else throw Error('Unexpected shard');
 }
 for(const id of ALL)for(const seed of [9861,9863])if(!seen.has(id+'|'+seed))
  throw Error('Missing 34×2 pilot '+id+'/'+seed);
 for(const id of DEEP)if(!seenDeep.has(id+'|9861'))
  throw Error('Missing deep '+id);
 const early=EARLY.map(E=>{
  const one=arm=>{
   const all=pilots.map(x=>x[arm]),items=all.map(x=>x.byE.find(x=>x.E===E));
   const attempts=items.reduce((n,x)=>n+x.attempts,0),bossWins=items.reduce((n,x)=>n+x.bossWins,0);
   const byKind=Object.fromEntries(['combat','elite','boss'].map(k=>{
    const a=items.map(x=>x.rooms[k]),n=a.reduce((n,x)=>n+x.n,0),wins=a.reduce((n,x)=>n+x.wins,0);
    return [k,{n,wins,winRate:percentage(wins,n)}];
   }));
   return {reached:all.filter(x=>x.reach>=E).length,
    attempts,bossWins,bossWinPerAttempt:percentage(bossWins,attempts),rooms:byKind};
  };
  return {E,old:one('before'),candidate:one('after')};
 });
 const earlyControl=[1,2,3,5,6,10,20].map(E=>{
  const pts=deep.flatMap(x=>x.byE.filter(y=>y.E===E)),summary=kind=>{
   const a=pts.map(x=>x[kind]),n=a.reduce((n,x)=>n+x.n,0),wins=a.reduce((n,x)=>n+x.wins,0);
   return {n,wins,winRate:percentage(wins,n),
    inTarget:n>0&&wins/n>=TARGETS[kind][0]/100&&wins/n<=TARGETS[kind][1]/100};
  };
  return {E,profiles:pts.length,normal:summary('normal'),elite:summary('elite'),
   boss:summary('boss')};
 });
 const realms=[2,3,5].flatMap(E=>REALMS.map(realm=>{
  const rows=deep.flatMap(x=>x.byRealm.filter(y=>y.E===E&&y.realm===realm)
   .flatMap(x=>x.fights)),one=kind=>{
    const x=rows.filter(q=>q.kind===kind),n=x.length,wins=x.filter(q=>q.win).length;
    return {n,wins,winRate:percentage(wins,n)};
   };
  return {E,realm,normal:one('normal'),elite:one('elite'),boss:one('boss')};
 }));
 const tail=[20,35,55,70,100,150,200].map(E=>{
  const pts=deep.flatMap(x=>x.byE.filter(y=>y.E===E)),one=k=>{
   const x=pts.map(y=>y[k]),n=x.reduce((n,y)=>n+y.n,0),wins=x.reduce((n,y)=>n+y.wins,0);
   return {n,wins,winRate:percentage(wins,n)};
  };
  return {E,players:pts.length,normal:one('normal'),elite:one('elite'),boss:one('boss')};
 });
 return {stage:'6.31',kind:'aggregate',sources:{old:hash(PREVIOUS),new:hash(CURRENT)},
  targets:TARGETS,curve:validate(),coverage:{profiles:34,pilotSeeds:2,
   pilotPairs:pilots.length,nativeAccounts:pilots.length*2+deep.length,
   naturalAttempts:pilots.reduce((n,x)=>n+x.before.attempts+x.after.attempts,0)+
    deep.reduce((n,x)=>n+x.coverage.attempts,0),
   deepAccounts:deep.length,realRealmSampleFights:deep.reduce((n,x)=>n+x.coverage.perRealmFights,0),
   deepControlFights:deep.reduce((n,x)=>n+x.coverage.checkpointFights,0),
   naturalTimeouts:pilots.reduce((n,x)=>n+x.before.nativeTimeouts.length+x.after.nativeTimeouts.length,0)+
    deep.reduce((n,x)=>n+x.coverage.timeouts,0),unexpectedErrors:0},
  early,earlyControl,realms,tail,profiles:pilots.map(x=>({
   id:x.id,seed:x.seed,armor:x.armor,families:x.families,
   priorE:x.before.reach,currentE:x.after.reach,
   oldBossWins:x.before.bossWins,newBossWins:x.after.bossWins,
   oldTimeouts:x.before.nativeTimeouts,newTimeouts:x.after.nativeTimeouts})),
  deep:deep.map(x=>({id:x.settings.profile,account:x.account,
   byE:x.byE,naturalBands:x.naturalBands})),
  caveats:['Agent policies are imperfect heuristics, not verified average players or expert optimizers.',
   'The targets are PLAYER wins per actual encounter, not Dungeon clear rates, and isolated controlled fights are not prepared Expeditions.',
   'Only reached native Camp checkpoints contribute high-E results; unreached expeditions are censored, not given automatic losses.',
   'Normal groups contain distinct role and count distributions; a 100% solo-win rate is not representative of 6 or 12 mobs.',
   'Separate realms are tested for normals and eight Elite identities at E2,E3,E5, using genuine early earned gear.',
   'Stage6.30 baseline is isolated to disposable native VM; no fake XP, talents, equipment or combat rewards.',
   'Single global curve was changed, so a perfect fit to all three distinct win-rate bands is not guaranteed.']};
}
function fmt(v){return v.n?v.wins+'/'+v.n+' ('+v.winRate+'%)':'—';}
function markdown(x){
 const lines=['# Wanderer Stage 6.31 — smooth exponentially compounded Expedition difficulty','',
  'Target player encounter win rates: normal 80–90%, Elite 60–70%, Boss 35–45%.','',
  '## Smooth reference — no manual level breakpoints','',
  '| E | Previous Stage6.30 | Candidate Stage6.31 | Next-E growth |',
  '|---:|---:|---:|---:|',
  ...x.curve.map(a=>'| E'+a.E+' | '+a.old.toFixed(3)+' | '+a.candidate.toFixed(3)+
   ' | '+a.growthPct+'% |'),'','## E1–E20 natural progression','',
  '| E | Prior reached | Candidate reached | Prior Bosses/attempts | Candidate Bosses/attempts | Candidate normal rooms | Candidate Elite rooms | Candidate Boss rooms |',
  '|---:|---:|---:|---|---|---|---|---|',
  ...x.early.map(a=>'| E'+a.E+' | '+a.old.reached+' | '+a.candidate.reached+
   ' | '+a.old.bossWins+'/'+a.old.attempts+' | '+a.candidate.bossWins+'/'+a.candidate.attempts+
   ' | '+fmt(a.candidate.rooms.combat)+' | '+fmt(a.candidate.rooms.elite)+
   ' | '+fmt(a.candidate.rooms.boss)+' |'),'',
  '## Controlled targets at truly reached levels','',
  '| E | Earned players | Normal | Elite | Boss |',
  '|---:|---:|---|---|---|',
  ...x.earlyControl.map(a=>'| E'+a.E+' | '+a.profiles+' | '+fmt(a.normal)+
   ' | '+fmt(a.elite)+' | '+fmt(a.boss)+' |'),'',
  '## Every Realm E2/E3/E5 with 8 individually identified Elites','',
  '| E | Realm | Normal | Elite | Boss |','|---:|---|---|---|---|',
  ...x.realms.map(a=>'| E'+a.E+' | '+a.realm+' | '+fmt(a.normal)+
   ' | '+fmt(a.elite)+' | '+fmt(a.boss)+' |'),'',
  '## Difficulty across advanced Expeditions (only players actually reaching E)','',
  '| E | Players | Normal | Elite | Boss |','|---:|---:|---|---|---|',
  ...x.tail.map(a=>'| E'+a.E+' | '+a.players+' | '+fmt(a.normal)+
   ' | '+fmt(a.elite)+' | '+fmt(a.boss)+' |'),'',
  '## Individual natural profiles','',
  '| Profile | Seed | Armor | Affinity plan | Prior reach | Candidate reach |',
  '|---|---:|---|---|---:|---:|',
  ...x.profiles.map(a=>'| '+a.id+' | '+a.seed+' | '+a.armor+' | '+a.families.join('/')+
   ' | E'+a.priorE+' | E'+a.currentE+' |'),'',
  '## Interpretation limits','',...x.caveats.map(c=>'- '+c),
  '','No balance acceptance, merge or deployment is implied.'];
 return lines.join('\n')+'\n';
}
function save(filename,result){
 fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true});
 fs.writeFileSync(filename,JSON.stringify(result,null,2)+'\n');
}
function main(args=process.argv.slice(2)){
 const cfg=config(args);let result;
 if(cfg.mode==='pilot')result=pilot(cfg);
 else if(cfg.mode==='deep')result=deep(cfg);
 else{
  const files=fs.readdirSync(cfg.inputs).filter(f=>/^v013-stage631-(pilot|deep)-[a-z0-9-]+\.json$/.test(f))
   .map(f=>path.join(cfg.inputs,f));
  result=aggregate(files);
 }
 save(cfg.out,result);
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(result));
 const compact=cfg.mode==='pilot'?{coverage:result.coverage,
  accounts:result.accounts.map(x=>({id:x.id,oldE:x.before.reach,newE:x.after.reach}))}:
  cfg.mode==='deep'?{profile:cfg.profile,account:result.account,
   coverage:result.coverage,levels:result.byE.map(x=>({E:x.E,normal:x.normal,
    elite:x.elite,boss:x.boss}))}:
  {coverage:result.coverage,early:result.early,earlyControl:result.earlyControl,
   realms:result.realms,tail:result.tail,
   profiles:result.deep.map(x=>({id:x.id,reached:x.account.endLevel,bossWins:x.account.bossWins}))};
 console.log('STAGE631='+JSON.stringify({mode:cfg.mode,seed:cfg.seed,...compact}));
 return result;
}
module.exports={BATCHES,ALL,DEEP,TARGETS,REALMS,EARLY,CURRENT,PREVIOUS,
 oldSource,oldValue,validate,config,classify,accountSummary,nativeAccount,
 pilot,deep,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE631_ERROR '+String(e.stack||e));process.exitCode=1;}}
