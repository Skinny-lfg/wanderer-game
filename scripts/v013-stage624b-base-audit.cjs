'use strict';
// Stage 6.24B candidate audit, native modules in sandboxed test VM ONLY.
// No production changes until earned-player baseline vs candidate is reviewed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const B=require('./v013-stage624-e1-e5-baseline.cjs');
const C=require('./v013-stage623-earned-matched-enemies.cjs');
const S=require('./simulate-progression.cjs');
const ROOT=path.resolve(__dirname,'..');
function replaceOnce(text,from,to,where){
 if(text.split(from).length!==2)throw Error('Candidate source drift: '+where+' '+from);
 return text.replace(from,to);
}
function candidate(){
 const files={};
 for(const file of ['index.html','online/v013-elite-abilities.js',
  'online/v013-enemy-roster.js','combat/v012-combat-runtime.js'])
  files[file]=fs.readFileSync(path.join(ROOT,file),'utf8');
 const changes={
  'index.html':[
   
   ['hp:1.10,atk:1.02,def:1.00','hp:1.01,atk:.98,def:1.00'],
   ['hp:1.03,atk:.75,def:.86','hp:1.00,atk:.735,def:.86'],
   ['hp:1.12,atk:.78,def:1.00','hp:1.20,atk:.84,def:1.00'],
   
  ],
  'online/v013-elite-abilities.js':[
   ['cast:1,hpFactor:.50,atkFactor:.35','cast:1,hpFactor:.48,atkFactor:.34'],
   ['damagePerStack:.0075','damagePerStack:.0070'],
   ["description:'Vitality: every 12s, prepares","description:'Vitality: first at 9s, then every 12s; prepares"],
   ['first:12,cooldown:12,cast:1','first:9,cooldown:12,cast:1']
  ],
  'online/v013-enemy-roster.js':[
   ['between(.53,.40,t),atk:between(.45,.34,t)','between(.53,.445,t),atk:between(.45,.385,t)'],
   ['between(.40,.29,u),atk:between(.34,.25,u)','between(.445,.32,u),atk:between(.385,.29,u)'],
  ],
  'combat/v012-combat-runtime.js':[
   ['Math.round(hit*.38)),Math.max(1,Math.round(e.maxhp*.06))','Math.round(hit*.33)),Math.max(1,Math.round(e.maxhp*.055))']
  ]
 };
 for(const [file,list] of Object.entries(changes))
  for(const [from,to] of list)files[file]=replaceOnce(files[file],from,to,file);
 const keys={
  stage624IndexSource:'index.html',
  stage624EliteSource:'online/v013-elite-abilities.js',
  stage624RosterSource:'online/v013-enemy-roster.js',
  stage624RuntimeSource:'combat/v012-combat-runtime.js'
 };
 const opts={};
 for(const [key,file] of Object.entries(keys))opts[key]=files[file];
 return {opts,files,changes,
  hashes:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')]))};
}
function evaluate(seed){
 const nat=B.progress(seed);
 const proposal=candidate();
 const pairs=[];
 for(const snap of nat.snapshots){
  const old=C.series({...snap,profile:snap.profile},0);
  const arms={};
  for(const id of C.ELITES){
   const raw=S.encounter(snap.level,C.model(snap),old.arenaSeed,'elite',{
    ...C.options(snap,'elite',id),...proposal.opts},undefined,undefined,undefined,1);
   const before=old.native.elites[id];
   const check={
    sameGear:raw.gearFingerprint===before.gearFingerprint,
    sameTalent:JSON.stringify(raw.controlledTalentNodes)===JSON.stringify(before.talentNodes),
    sameStartingHealth:raw.hpMax===before.hpMax&&raw.hpStart===before.hpStart,
    sameStartingMana:raw.mpMax===before.mpMax&&raw.mpStart===before.mpStart,
    sameArena:raw.affinity===before.affinity&&raw.resolvedSeed===before.resolvedSeed&&
     raw.plannedConditionId===before.conditionId&&raw.risk===before.risk,
    actualNamedElite:raw.eliteType===id&&raw.nativeEncounter==='elite',
    resolved:!raw.timedOut&&(raw.won||raw.died)};
   if(Object.values(check).some(v=>!v))throw Error('Stage 6.24B native parity '+snap.checkpointKey+'/'+id+' '+JSON.stringify(check));
   arms[id]={oldWin:before.win,newWin:!!raw.won,
    oldDamage:before.damageTaken,newDamage:raw.damageTaken,
    oldHp:before.initialRosterHp,newHp:raw.roster.reduce((sum,v)=>sum+v.maxHp,0),
    oldAtk:before.initialRosterAtk,newAtk:raw.roster.reduce((sum,v)=>sum+v.attack,0),
    oldSummons:before.eliteSummons,newSummons:raw.eliteSummons};
  }
  const sizes={};
  for(const size of B.groups){
   const before=B.groupFight(snap,old.arenaSeed,size,old.native.tank);
   const after=S.encounter(snap.level,C.model(snap),old.arenaSeed,'normal',{
    ...C.options(snap,'normal'),...proposal.opts},
    undefined,undefined,undefined,1,size);
   const valid=after.gearFingerprint===old.native.tank.gearFingerprint&&
    after.affinity===old.native.tank.affinity&&after.resolvedSeed===old.native.tank.resolvedSeed&&
    after.hpStart===old.native.tank.hpStart&&after.hpMax===old.native.tank.hpMax&&
    after.initialEnemies===size&&after.nativeEncounter==='normal'&&
    !after.timedOut&&(after.won||after.died);
   if(!valid)throw Error('Stage 6.24B group parity '+snap.checkpointKey+'/'+size);
   sizes[size]={oldWin:before.won,newWin:after.won,
    oldDamage:before.damageTaken,newDamage:after.damageTaken,
    oldRosterHp:before.roles,newRoles:after.initialRoles};
  }
  pairs.push({key:snap.checkpointKey,seed,profile:snap.profile,level:snap.level,
   oldTank:old.native.tank.win,oldBoss:old.native.boss.win,
   elites:arms,groups:sizes});
 }
 return {stage:'6.24B',mode:'seed',seed,source:nat.source,
  candidateHashes:proposal.hashes,accounts:nat.accounts,
  coverage:{accounts:nat.accounts.length,earnedSnapshots:nat.snapshots.length,
   controlledBattles:nat.snapshots.length*(10+8+B.groups.length),errors:0},
  pairs};
}
function sum(pairs){
 const out={};
 for(const level of B.levels){
  const src=pairs.filter(p=>p.level===level);
  const byElite={};
  for(const id of C.ELITES){
   const arr=src.map(p=>p.elites[id]);
   byElite[id]={n:arr.length,before:arr.filter(x=>x.oldWin).length,after:arr.filter(x=>x.newWin).length,
    damageBefore:B.outcomes(arr.map(x=>({damageTaken:x.oldDamage}))).medianDamage,
    damageAfter:B.outcomes(arr.map(x=>({damageTaken:x.newDamage}))).medianDamage,
    rosterHpBefore:arr.length?Math.round(arr.reduce((n,x)=>n+x.oldHp,0)/arr.length):null,
    rosterHpAfter:arr.length?Math.round(arr.reduce((n,x)=>n+x.newHp,0)/arr.length):null};
  }
  const normalGroups={};
  for(const size of B.groups){
   const arr=src.map(p=>p.groups[size]);
   normalGroups[size]={n:arr.length,before:arr.filter(x=>x.oldWin).length,
    after:arr.filter(x=>x.newWin).length,
    damageBefore:B.outcomes(arr.map(x=>({damageTaken:x.oldDamage}))).medianDamage,
    damageAfter:B.outcomes(arr.map(x=>({damageTaken:x.newDamage}))).medianDamage};
  }
  out[level]={n:src.length,
   soloTank:src.filter(p=>p.oldTank).length,
   bossUnprepared:src.filter(p=>p.oldBoss).length,
   byElite,normalGroups};
 }
 return out;
}
function aggregate(shards){
 if(!shards.length)throw Error('Missing candidate shards');
 const src=shards[0].source,hashes=shards[0].candidateHashes;
 const seeds=new Set(),keys=new Set(),pairs=[];
 for(const shard of shards){
  if(shard.stage!=='6.24B'||shard.mode!=='seed'||shard.source!==src||
   JSON.stringify(shard.candidateHashes)!==JSON.stringify(hashes)||
   seeds.has(shard.seed)||shard.coverage.errors)throw Error('Incompatible 6.24B shards');
  seeds.add(shard.seed);
  for(const p of shard.pairs){
   if(keys.has(p.key))throw Error('Duplicate earned candidate checkpoint');
   keys.add(p.key);pairs.push(p);
  }
 }
 return {stage:'6.24B',source:src,candidateHashes:hashes,
  coverage:{seeds:seeds.size,earnedSnapshots:pairs.length,
   controlledBattles:shards.reduce((a,s)=>a+s.coverage.controlledBattles,0),errors:0,
   allNativeMatched:true},levels:sum(pairs),pairs};
}
function main(args=process.argv.slice(2)){
 const opts={mode:'seed',seed:9701,out:'reports/stage624b-9701.json',inputs:null};
 for(const a of args){
  const m=/^--([a-z-]+)=(.*)$/.exec(a);if(!m)throw Error('Invalid 6.24B arg '+a);
  if(m[1]==='seed')opts.seed=Number(m[2]);else if(m[1]==='out')opts.out=m[2];
  else if(m[1]==='inputs')opts.inputs=m[2];else if(m[1]==='mode')opts.mode=m[2];
  else throw Error('Unknown Stage 6.24B arg');
 }
 if(!opts.out.startsWith('reports/')||opts.out.includes('..')||!opts.out.endsWith('.json'))throw Error('Unsafe output');
 let result;
 if(opts.mode==='seed'){
  if(!Number.isInteger(opts.seed)||opts.seed<1||opts.seed>1e7)throw Error('Invalid seed');
  result=evaluate(opts.seed);
 }else if(opts.mode==='aggregate'){
  if(!opts.inputs||!opts.inputs.startsWith('reports/')||opts.inputs.includes('..'))throw Error('Invalid directory');
  const files=fs.readdirSync(path.join(ROOT,opts.inputs)).filter(n=>/^stage624b-\d+\.json$/.test(n)).sort();
  result=aggregate(files.map(n=>JSON.parse(fs.readFileSync(path.join(ROOT,opts.inputs,n),'utf8'))));
 }else throw Error('Invalid Stage 6.24B mode');
 const dest=path.join(ROOT,opts.out);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 if(result.levels)console.log('STAGE624B='+JSON.stringify({coverage:result.coverage,levels:result.levels}));
 else console.log('STAGE624B='+JSON.stringify({seed:result.seed,coverage:result.coverage}));
 return result;
}
module.exports={replaceOnce,candidate,evaluate,sum,aggregate,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE624B_ERROR '+(e.stack||e));process.exitCode=1;}}
