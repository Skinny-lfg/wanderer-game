'use strict';
// Stage6.30: 34 native build archetypes, two seeds, paired early reference;
// 12 deep E200 cohorts from real Camp/equipment/talent/attribute progression.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs'),D=require('./v013-stage628-postcap-difficulty.cjs');
const P=globalThis.WandererExpeditionProgression;
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const pct=(a,b)=>b?Number((100*a/b).toFixed(1)):null;
const med=x=>{x=x.filter(Number.isFinite).sort((a,b)=>a-b);if(!x.length)return null;let i=x.length>>1;return x.length%2?x[i]:(x[i-1]+x[i])/2;};
const BATCHES=Object.freeze({
 'legacy-defense':['cautious','balanced','daring','plate-warden','leather-duelist','cloth-battlemage','hexblade-hybrid'],
 'legacy-casters':['magic-fire','magic-frost','magic-lightning','magic-arcane','magic-wand','magic-staff'],
 'strategic-pure':['smart-blood-pure','smart-fury-pure','smart-magic-arcane-pure','smart-magic-lightning-pure','smart-vitality-pure'],
 'strategic-hybrid':['smart-blood-fury','smart-blood-fury-vitality','smart-blood-fury-vitality-no-mixed','smart-fury-blood-aegis','smart-magic-fire-aegis','smart-magic-frost-vitality','smart-decay-magic-aegis','smart-aegis-vitality'],
 'strategic-weapon':['smart-blood-sword','smart-blood-two-handed','smart-fury-daggers','smart-fury-bow','smart-magic-wand','smart-magic-staff','smart-magic-wand-offense','smart-magic-wand-defense']
});
const PROFILES=Object.values(BATCHES).flat();
const DEEP=['smart-blood-pure','smart-fury-pure','smart-magic-arcane-pure',
 'smart-magic-lightning-pure','smart-vitality-pure','smart-decay-magic-aegis',
 'smart-aegis-vitality','cloth-battlemage','leather-duelist',
 'magic-fire','hexblade-hybrid','smart-blood-fury-vitality'];
const SOURCE=fs.readFileSync(path.resolve(__dirname,'../combat/expedition-progression.js'),'utf8');
const OLDREF=[
 'function enemyReference(level){',
 ' checked(level);',
 ' if(level<=5)return level;',
 ' const x=level-5,{rate,weight}=ENEMY_EXPONENTIAL_GROWTH;',
 ' const base=5+Math.log1p(x/5);',
 ' const extra=weight*(Math.expm1(rate*x)-rate*x);',
 ' const reference=base+extra;',
 " if(!Number.isFinite(reference))throw Error('Expedition enemy reference exceeds finite range at E'+level);",
 ' return reference;',
 '}'
].join('\n');
function baselineSource(){
 const a=SOURCE.indexOf('function enemyReference(level){'),b=SOURCE.indexOf('\nconst UNITY=',a);
 if(a<0||b<0||SOURCE.indexOf('function enemyReference(level){',a+1)>=0||
  !SOURCE.slice(a,b).includes('shoulderLevels')||
  !SOURCE.slice(a,b).includes('earlyRate'))
  throw Error('Stage6.30 native reference source changed: refuse stale A/B');
 const src=SOURCE.slice(0,a)+OLDREF+SOURCE.slice(b);
 new Function(src);return src;
}
const BASELINE=baselineSource();
function parse(argv=process.argv.slice(2)){
 const o={mode:'pilot',batch:'legacy-defense',profile:'cautious',seed:9861,
  maxAttempts:24,maxTotalAttempts:360,trials:1,
  out:'reports/v013-stage630-legacy-defense-9861-pilot.json',
  inputs:'reports/stage630-shards'};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Invalid CLI '+arg);
  const [,k,v]=m;
  if(k==='mode')o.mode=v;
  else if(k==='batch')o.batch=v;
  else if(k==='profile')o.profile=v;
  else if(k==='seed')o.seed=Number(v);
  else if(k==='max-attempts')o.maxAttempts=Number(v);
  else if(k==='max-total-attempts')o.maxTotalAttempts=Number(v);
  else if(k==='trials')o.trials=Number(v);
  else if(k==='out')o.out=v;
  else if(k==='inputs')o.inputs=v;
  else throw Error('Unknown CLI '+k);
 }
 if(!['pilot','deep','aggregate'].includes(o.mode)||!/^reports\/[a-z0-9-]+\.json$/.test(o.out))throw Error('Unsafe mode/out');
 if(o.mode==='aggregate'){
  if(!/^reports\/[a-z0-9/-]+$/.test(o.inputs)||o.inputs.includes('..'))throw Error('Unsafe aggregate input');
  return o;
 }
 if(!Number.isSafeInteger(o.seed)||o.seed<1||o.seed>1000000||
  !Number.isSafeInteger(o.maxAttempts)||o.maxAttempts<1||o.maxAttempts>36||
  !Number.isSafeInteger(o.maxTotalAttempts)||o.maxTotalAttempts<50||o.maxTotalAttempts>400||
  !Number.isSafeInteger(o.trials)||o.trials<1||o.trials>3)throw Error('Invalid bounds');
 if(o.mode==='pilot'&&!BATCHES[o.batch])throw Error('Unknown pilot batch');
 if(o.mode==='deep'&&!DEEP.includes(o.profile))throw Error('Unknown deep profile');
 return o;
}
function validate(){
 if(PROFILES.length!==34||new Set(PROFILES).size!==34||DEEP.length!==12||
  PROFILES.some(k=>!N.PROFILES[k])||DEEP.some(k=>!PROFILES.includes(k)))
  throw Error('Not exactly 34 preexisting strategies / 12 deep');
 if(P.ENEMY_EXPONENTIAL_GROWTH.earlyRate!==.12||
  P.ENEMY_EXPONENTIAL_GROWTH.shoulderLevels!==.4||
  P.ENEMY_EXPONENTIAL_GROWTH.rate!==.015||
  P.enemyReference(5)!==5)throw Error('Unexpected curve revision');
 for(const id of PROFILES){
  const p=N.PROFILES[id];
  if(!p.families.length||!p.weapons.length||!['Cloth','Leather','Plate'].includes(p.armor))
   throw Error('Invalid native profile '+id);
 }
 return true;
}
function oldValue(E){if(E<=5)return E;const x=E-5;return 5+Math.log1p(x/5)+2*(Math.expm1(.015*x)-.015*x);}
function curve(){return [1,2,3,4,5,6,10,20,35,55,70,100,150,200].map(E=>({
 E,old:oldValue(E),candidate:P.enemyReference(E),ratio:P.enemyReference(E)/oldValue(E)}));}
function capture(a){
 const attempt=a.attempts;
 const exp=[1,2,3,4,5,6,10,20,35,55,70,100,150,200].map(E=>{
  const subset=attempt.filter(x=>x.level===E);
  return {E,attempts:subset.length,bossWins:subset.filter(x=>x.bossWon).length,
   deaths:subset.filter(x=>x.status==='defeat').length};
 });
 return {profile:a.profile,seed:a.seed,reach:a.endLevel,bossWins:attempt.filter(x=>x.bossWon).length,
  attempts:attempt.length,xp:a.xp,stop:a.stopReason||null,
  finalGear:a.finalGear,byE:exp,bands:D.windows(attempt)};
}
function timeoutClassification(result,seed,id){
 const errors=result.accounts.flatMap(a=>a.attempts.filter(x=>x.error)
  .map(x=>({E:x.level,attempt:x.attempt,error:x.error})));
 const nativeTimeouts=errors.filter(x=>x.error==='Native combat timeout');
 const unexpected=errors.filter(x=>x.error!=='Native combat timeout');
 if(unexpected.length||errors.length!==result.coverage.errors)
  throw Error('Unexpected native error for '+id+' seed '+seed+': '+JSON.stringify(errors));
 return nativeTimeouts;
}
function runAccount(seed,id,maxLevel,cfg,source){
 const opts={...N.DEFAULTS,seeds:[seed],profiles:[id],
  maxLevel,maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts};
 const result=N.run(opts,{decisionModel:'adaptive',
  ...(source?{moduleOverrides:{'combat/expedition-progression.js':source}}:{})});
 const timeouts=timeoutClassification(result,seed,id);
 const a=result.accounts[0];
 if(result.accounts.length!==1||a.seed!==seed||a.profile!==id)
  throw Error('Wrong real account '+id+' '+seed);
 // A capped native fight is not a victory or defeat; censor any unreached E.
 return {...capture(a),nativeCombatTimeouts:timeouts};
}
function pilot(cfg){
 validate();
 const accounts=[];
 for(const id of BATCHES[cfg.batch]){
  const before=runAccount(cfg.seed,id,20,cfg,BASELINE);
  const after=runAccount(cfg.seed,id,20,cfg,null);
  const p=N.PROFILES[id];
  accounts.push({id,seed:cfg.seed,
   spec:{families:p.families,armor:p.armor,weapons:p.weapons,style:p.style,
    risk:p.risk,plan:p.plan||null,element:p.element||null},
   before,after});
  console.log('STAGE630_PROGRESS='+JSON.stringify({profile:id,seed:cfg.seed,
   oldE:before.reach,newE:after.reach,oldBossWins:before.bossWins,newBossWins:after.bossWins}));
 }
 return {stage:'6.30',kind:'pilot',settings:cfg,sources:{old:hash(BASELINE),new:hash(SOURCE)},
  coverage:{profiles:accounts.length,accounts:accounts.length*2,
   attempts:accounts.reduce((n,x)=>n+x.before.attempts+x.after.attempts,0),
   nativeCombatTimeouts:accounts.reduce((n,x)=>n+x.before.nativeCombatTimeouts.length+
     x.after.nativeCombatTimeouts.length,0),errors:0},
  reference:curve(),accounts};
}
function deep(cfg){
 validate();
 const r=D.audit({seed:cfg.seed,profile:cfg.profile,maxLevel:200,
  maxAttempts:cfg.maxAttempts,maxTotalAttempts:cfg.maxTotalAttempts,trials:cfg.trials,
  allowNativeCombatTimeouts:true});
 const checkpoints=r.checkpoints.map(c=>{
  const kinds=['normal','tank','elite','boss'];
  const fights=r.matchedFights.filter(x=>x.E===c.level);
  const perKind=Object.fromEntries(kinds.map(kind=>{
   const a=fights.filter(x=>x.type===kind),wins=a.filter(x=>x.actual.win).length;
   return [kind,{n:a.length,wins,losses:a.filter(x=>x.actual.loss).length,
    timeouts:a.filter(x=>x.actual.timeout).length,winPct:pct(wins,a.length),
    medianTaken:med(a.map(x=>x.actual.damageTaken))}];
  }));
  return {E:c.level,xp:c.xp,talents:c.talentEarned,attributes:c.attributeSpent,
   allocation:c.attributes,armor:N.PROFILES[cfg.profile].armor,
   weapon:c.state.equip.weapon?.subtype||null,weaponRarity:c.state.equip.weapon?.rarity||null,
   gearRarities:c.equippedRarity,
   heroStats:c.statSnapshot,kinds:perKind};
 });
 return {stage:'6.30',kind:'deep',settings:cfg,
  sources:{old:hash(BASELINE),new:hash(SOURCE)},
  coverage:{profiles:1,accounts:1,attempts:r.account.attempts,
   fights:r.coverage.encounters,nativeCombatTimeouts:r.coverage.naturalCombatTimeouts,
   errors:r.coverage.errors},
  account:r.account,
  profile:{id:cfg.profile,meta:N.PROFILES[cfg.profile]},
  checkpoints,naturalBands:r.naturalWindowDifficulty};
}
function aggregate(files){
 validate();
 const pilots=[],deeps=[],seenPilot=new Set(),seenDeep=new Set();
 for(const filename of files.sort()){
  const r=JSON.parse(fs.readFileSync(filename,'utf8'));
  if(r.stage!=='6.30'||r.coverage.errors||r.sources.old!==hash(BASELINE)||
   r.sources.new!==hash(SOURCE))throw Error('Wrong source/invalid shard '+filename);
  if(r.kind==='pilot'){
   for(const a of r.accounts){
    const k=a.id+'|'+a.seed;
    if(seenPilot.has(k))throw Error('Duplicate pilot '+k);
    seenPilot.add(k);pilots.push(a);
   }
  }else if(r.kind==='deep'){
   const k=r.settings.profile+'|'+r.settings.seed;
   if(seenDeep.has(k))throw Error('Duplicate deep '+k);
   seenDeep.add(k);deeps.push(r);
  }else throw Error('Unexpected Stage6.30 shard kind');
 }
 for(const id of PROFILES)for(const seed of [9861,9863]){
  if(!seenPilot.has(id+'|'+seed))throw Error('Missing E1-E20 native pilot '+id+' seed'+seed);
 }
 for(const id of DEEP)if(!seenDeep.has(id+'|9861'))throw Error('Missing E200 native audit '+id);
 const early=[1,2,3,4,5,6,10,20].map(E=>{
  const arm=name=>{
   const a=pilots.map(x=>x[name]);
   const reached=a.filter(x=>x.reach>=E).length;
   const b=a.map(x=>x.byE.find(q=>q.E===E)),attempts=b.reduce((n,x)=>n+x.attempts,0),
    bossWins=b.reduce((n,x)=>n+x.bossWins,0);
   return {reached,attempts,bossWins,winPctPerAttempt:pct(bossWins,attempts)};
  };
  return {E,old:arm('before'),new:arm('after')};
 });
 const deepByE=D.LEVELS.map(E=>{
  const rows=deeps.map(x=>x.checkpoints.find(c=>c.E===E)).filter(Boolean);
  const type=k=>{
   const x=rows.map(r=>r.kinds[k]),n=x.reduce((n,z)=>n+z.n,0),
    wins=x.reduce((n,z)=>n+z.wins,0);
   return {n,wins,winPct:pct(wins,n),
    medianTaken:med(x.map(z=>z.medianTaken))};
  };
  return {E,accounts:rows.length,talentsMedian:med(rows.map(r=>r.talents)),
   attributesMedian:med(rows.map(r=>r.attributes)),
   normal:type('normal'),tank:type('tank'),elite:type('elite'),boss:type('boss')};
 });
 return {stage:'6.30',kind:'aggregate',sources:{old:hash(BASELINE),new:hash(SOURCE)},
  reference:curve(),coverage:{
   profiles:PROFILES.length,seeds:2,pilotPairs:pilots.length,pilotNativeAccounts:pilots.length*2,
   pilotAttempts:pilots.reduce((n,x)=>n+x.before.attempts+x.after.attempts,0),
   pilotNativeTimeouts:pilots.reduce((n,x)=>n+x.before.nativeCombatTimeouts.length+
     x.after.nativeCombatTimeouts.length,0),
   deepProfiles:deeps.length,deepAttempts:deeps.reduce((n,x)=>n+x.coverage.attempts,0),
   deepNativeTimeouts:deeps.reduce((n,x)=>n+x.coverage.nativeCombatTimeouts,0),
   deepE200:deeps.filter(x=>x.checkpoints.some(c=>c.E===200)).length,
   deepControlledFights:deeps.reduce((n,x)=>n+x.coverage.fights,0),errors:0},
  early,deepByE,
  pilot:pilots.map(x=>({
   id:x.id,seed:x.seed,spec:x.spec,
   oldE:x.before.reach,newE:x.after.reach,oldBossWins:x.before.bossWins,
   newBossWins:x.after.bossWins,oldAttempts:x.before.attempts,newAttempts:x.after.attempts,
   oldStop:x.before.stop,newStop:x.after.stop,
   oldTimeouts:x.before.nativeCombatTimeouts,newTimeouts:x.after.nativeCombatTimeouts})),
  deep:deeps.map(x=>({id:x.profile.id,seed:x.settings.seed,
   account:x.account,checkpoints:x.checkpoints,naturalBands:x.naturalBands})),
  limits:['Native E1–E20 accounts start at zero XP with real loot, Camp, Talents and resources.',
   'Only old enemy reference is injected into isolated VM for paired early pilot.',
   'Different early battles may change the gear and Talent decisions earned later.',
   'E200 snapshots are recorded only if naturally reached; no XP/gear synthesis.',
   'Full Expedition boss victories differ from controlled first-ring Boss fights without preparation.',
   'Agents are heuristic, not population estimates; two seeds do not give robust probabilities.',
   'Bounded native combat timeouts are explicitly recorded and their missing future Expeditions censored, never treated as win/loss or silently discarded.',
   'Only the shared enemy-reference curve was edited; no build or individual boss coefficient changes.']};
}
function fmt(x){return x.n?x.wins+'/'+x.n+' ('+x.winPct+'%)':'—';}
function markdown(r){
 const a=['# Stage 6.30 — early exponential E1–E5, 34 native builds, two seeds and twelve E200 studies','',
  '## Exact curve reference','',
  '| E | Stage6.29 | Stage6.30 | Change |',
  '|---:|---:|---:|---:|',
  ...r.reference.map(x=>'| E'+x.E+' | '+x.old.toFixed(3)+' | '+x.candidate.toFixed(3)+
   ' | '+((x.ratio-1)*100).toFixed(1)+'% |'),'',
  '## E1–E20 native early pilot','',
  '| E | Old accounts reached | New accounts reached | Old Boss wins/attempts | New Boss wins/attempts |',
  '|---:|---:|---:|---|---|',
  ...r.early.map(x=>'| E'+x.E+' | '+x.old.reached+' | '+x.new.reached+
   ' | '+x.old.bossWins+'/'+x.old.attempts+' | '+x.new.bossWins+'/'+x.new.attempts+' |'),'',
  '## Each naturally earned player build','',
  '| Profile | Seed | Families | Armor | Style | Old E | New E | Old Bosses | New Bosses |',
  '|---|---:|---|---|---|---:|---:|---:|---:|',
  ...r.pilot.map(x=>'| '+x.id+' | '+x.seed+' | '+x.spec.families.join('/')+
   ' | '+x.spec.armor+' | '+x.spec.style+' | '+x.oldE+' | '+x.newE+
   ' | '+x.oldBossWins+' | '+x.newBossWins+' |'),'',
  '## Deep control: actual E1–E200 earned characters, 6 affinities','',
  '| E | Accounts genuinely reached | Talents | Post100 stats | Normal | Tank | Elite | Boss |',
  '|---:|---:|---:|---:|---|---|---|---|',
  ...r.deepByE.map(x=>'| E'+x.E+' | '+x.accounts+' | '+(x.talentsMedian??'—')+
   ' | '+(x.attributesMedian??'—')+' | '+fmt(x.normal)+' | '+fmt(x.tank)+
   ' | '+fmt(x.elite)+' | '+fmt(x.boss)+' |'),'',
  '## Deep runs','',
  ...r.deep.map(x=>'- '+x.id+': reached E'+x.account.endLevel+', '+
   x.account.attempts+' natural attempts; '+x.account.bossWins+' Boss wins, E200 '+
   (x.checkpoints.some(c=>c.E===200)?'observed':'censored')),'',
  '## Limits','',...r.limits.map(x=>'- '+x),
  '','No merge, no deploy, no character or individual enemy changes.'];
 return a.join('\n');
}
function save(file,r){
 if(!/^reports\/[a-z0-9-]+\.json$/.test(file))throw Error('Unsafe Stage6.30 path');
 fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');
}
function main(argv=process.argv.slice(2)){
 const cfg=parse(argv);
 const r=cfg.mode==='pilot'?pilot(cfg):cfg.mode==='deep'?deep(cfg):
  aggregate(fs.readdirSync(cfg.inputs).filter(f=>/^v013-stage630-[a-z0-9-]+\.json$/.test(f))
   .map(f=>path.join(cfg.inputs,f)));
 save(cfg.out,r);
 if(cfg.mode==='aggregate')fs.writeFileSync(cfg.out.replace(/\.json$/,'.md'),markdown(r)+'\n');
 const compact=cfg.mode==='aggregate'?{coverage:r.coverage,early:r.early,
  deepByE:r.deepByE,deep:r.deep.map(x=>({id:x.id,E:x.account.endLevel,bossWins:x.account.bossWins}))}:
  cfg.mode==='pilot'?{coverage:r.coverage,accounts:r.accounts.map(x=>({
   id:x.id,oldE:x.before.reach,newE:x.after.reach,oldBossWins:x.before.bossWins,
   newBossWins:x.after.bossWins}))}:{coverage:r.coverage,profile:cfg.profile,
   E:r.account.endLevel,bossWins:r.account.bossWins,
   checkpoints:r.checkpoints.map(x=>({E:x.E,talents:x.talents,stats:x.attributes,
    elite:x.kinds.elite.winPct,boss:x.kinds.boss.winPct}))};
 console.log('STAGE630='+JSON.stringify({mode:cfg.mode,seed:cfg.seed,...compact}));
 return r;
}
module.exports={BATCHES,PROFILES,DEEP,SOURCE,BASELINE,baselineSource,parse,validate,
 oldValue,curve,capture,timeoutClassification,runAccount,pilot,deep,aggregate,markdown,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE630_ERROR '+String(e.stack||e));process.exitCode=1;}}
