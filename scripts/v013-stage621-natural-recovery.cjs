'use strict';
// Stage 6.21: genuine persistent account cohorts, never force loot/XP/unlock.
// Two independent seeds and three different legal native agent strategies.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const MODES=new Set(['baseline','candidate','boss-only','combined','retest']);
// The historical runtime is reconstructed EXACTLY in the isolated test VM.
// The live game only contains the approved Stage 6.21 six-Boss adjustment.
const SOURCE_PATH='combat/v012-combat-runtime.js';
const LIVE_SOURCE=fs.readFileSync(path.resolve(__dirname,'..',SOURCE_PATH),'utf8');
const BEFORE_CORE=` const elite=miniboss?ports.eliteArchetype(ports.state.run):null;
 // Stage 6.19: only named Elites get level-specific, archetype-specific
 // growth. Normal mobs and Bosses continue to use their native formulas.
 const eliteGrowth=elite?root.WandererV013EliteAbilities.scalingFor(elite.id,level):null;
 const hp=Math.max(1,Math.round(v.hp*mult*(elite?elite.hp*eliteGrowth.hp:role==='minion'?.68:role==='tank'?1.32:role==='skirmisher'?.96:role==='caster'?.90:1)));
 const atk=Math.max(1,Math.round(v.atk*mult*(elite?elite.atk*eliteGrowth.atk:role==='minion'?.70:role==='skirmisher'?1.10:role==='caster'?1.08:role==='tank'?.90:1)));`;
const AFTER_CORE=` const elite=miniboss?ports.eliteArchetype(ports.state.run):null;
 // Stage 6.19 Elite growth stays independent of Stage 6.21 early Boss tuning.
 const eliteGrowth=elite?root.WandererV013EliteAbilities.scalingFor(elite.id,level):null;
 const bossEarly=boss?root.WandererV013BossAbilities.earlyScale(variant.style,level):null;
 const hp=Math.max(1,Math.round(v.hp*mult*(elite?elite.hp*eliteGrowth.hp:role==='minion'?.68:role==='tank'?1.32:role==='skirmisher'?.96:role==='caster'?.90:1)*(bossEarly?.hp??1)));
 const atk=Math.max(1,Math.round(v.atk*mult*(elite?elite.atk*eliteGrowth.atk:role==='minion'?.70:role==='skirmisher'?1.10:role==='caster'?1.08:role==='tank'?.90:1)*(bossEarly?.atk??1)));`;
const ORIGINAL_ATTACK=" const atk=Math.max(1,Math.round(v.atk*mult*(elite?elite.atk*eliteGrowth.atk:role==='minion'?.70:role==='skirmisher'?1.10:role==='caster'?1.08:role==='tank'?.90:1)));";
const LIVE_ATTACK=" const atk=Math.max(1,Math.round(v.atk*mult*(elite?elite.atk*eliteGrowth.atk:role==='minion'?.70:role==='skirmisher'?1.10:role==='caster'?1.08:role==='tank'?.90:1)*(bossEarly?.atk??1)));";
const EARLY_NORMAL_DECL=` // Test-only normal E1/E2 role attack alternative, not deployed.
 const earlyNormalAttack=!boss&&!miniboss&&level<=2?
  (level===1?({tank:.86,skirmisher:.78,caster:.80,minion:.86}[role]||1):
   ({tank:.95,skirmisher:.93,caster:.94,minion:.96}[role]||1)):1;`;
const EARLY_ATTACK=EARLY_NORMAL_DECL+"\n"+ORIGINAL_ATTACK.replace(')));',')*earlyNormalAttack));');
const LIVE_NORMAL_ATTACK=EARLY_NORMAL_DECL+"\n"+LIVE_ATTACK.replace(')));',')*earlyNormalAttack));');
function gitBlobSha(text){
 const bytes=Buffer.from(text);
 return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
}
const PRE_STAGE621_GIT_BLOB='6cf97b10add8610589e225bddbf6b7cc1ad10389';
function baselineSource(){
 if(LIVE_SOURCE.split(AFTER_CORE).length!==2)throw Error('Stage 6.21 live Boss formula moved');
 const result=LIVE_SOURCE.replace(AFTER_CORE,BEFORE_CORE);
 if(gitBlobSha(result)!==PRE_STAGE621_GIT_BLOB)
  throw Error('Historical Stage 6.20 runtime no longer byte-identical');
 return result;
}
function candidateSource(){
 const base=baselineSource();
 if(base.split(ORIGINAL_ATTACK).length!==2)throw Error('Historical native attack formula changed');
 return base.replace(ORIGINAL_ATTACK,EARLY_ATTACK);
}
function bossCandidateSource(){
 if(LIVE_SOURCE.split(AFTER_CORE).length!==2)throw Error('Current live Stage 6.21 Boss implementation missing');
 return LIVE_SOURCE;
}
function combinedSource(){
 const bossSource=bossCandidateSource();
 if(bossSource.split(LIVE_ATTACK).length!==2)throw Error('Current native Boss attack formula changed');
 return bossSource.replace(LIVE_ATTACK,LIVE_NORMAL_ATTACK);
}
function accountDigest(account){
 const at=account.attempts||[];
 return {seed:account.seed,profile:account.profile,reached:account.reached,unlocked:account.endLevel,
  xp:account.xp,earnedGear:account.finalGear?.total,remainingStarter:account.finalGear?.starter,
  attempts:at.length,spentTalents:account.talents?.length,stop:account.stopReason,
  perAttempt:at.map(a=>({level:a.level,attempt:a.attempt,status:a.status,realm:a.affinity,
   risk:a.risk,error:a.error||null,bossReached:a.bossReached,bossWon:a.bossWon,
   rooms:a.rooms?.length,xp:a.xpEarned,gearDrops:(a.rooms||[]).reduce((t,r)=>t+(r.loot?.length||0),0),
   potions:a.potions?.length,boons:a.boons?.length,shop:a.camp?.bought?.length,
   crafted:a.camp?.crafted?.length,remainingGold:a.after?.gold,
   hpFirst:a.rooms?.[0]?.hpStart,hpAfterFirst:a.rooms?.[0]?.hpEnd,firstRole:a.rooms?.[0]?.roomType,
   boss:a.rooms?.find(r=>r.roomType==='boss')?{
    won:a.rooms.find(r=>r.roomType==='boss').won,
    hpStart:a.rooms.find(r=>r.roomType==='boss').hpStart,
    hpMax:a.rooms.find(r=>r.roomType==='boss').hpMax,
    dmg:a.rooms.find(r=>r.roomType==='boss').damageTaken,
    bossStyle:a.rooms.find(r=>r.roomType==='boss').bossStyle
   }:null,
   extractedFor:a.decisions?.find(d=>d.type==='extract')?.reason||null,
   deathAt:a.rooms?.findLast(r=>r.died)?.roomType||null,
   prep:a.prepAtBoss||null
  }))};
}
const count=(rows,cb)=>rows.filter(cb).length;
function summary(result){
 const aa=result.accounts,all=aa.flatMap(a=>a.attempts||[]);
 const perLevel=result.levels.map(x=>({
  level:x.level,accountsReached:x.accountsReached,attempts:x.attempts,wins:x.wins,deaths:x.deaths,
  extractions:x.extractions,bossReached:x.bossReached,roomsWon:x.roomsWon,
  firstRoomGearDrops:x.firstRoomGearDrops,firstRoomsWithoutGear:x.firstRoomsWithoutGear,
  eliteFights:x.eliteFights,eliteWins:x.eliteWins,potionsUsed:x.potionsUsed,
  boonsSelected:x.boonsSelected,gearUpgrades:x.gearUpgrades,nativeXpEarned:x.nativeXpEarned,errors:x.errors
 }));
 const reasons={};for(const a of all)for(const d of a.decisions||[])if(d.type==='extract')reasons[d.reason]=(reasons[d.reason]||0)+1;
 const fights=all.flatMap(a=>a.rooms||[]),first=all.map(a=>a.rooms?.[0]).filter(Boolean);
 return {accounts:aa.length,unlockedE2:count(aa,a=>a.endLevel>=2),
  unlockedE3:count(aa,a=>a.endLevel>=3),atLeastOneBoss:count(aa,a=>a.attempts?.some(t=>t.bossReached)),
  totalAttempts:all.length,totalFights:fights.length,errors:result.coverage.errors,
  deathByKind:Object.fromEntries(['combat','elite','boss'].map(kind=>[kind,count(fights,r=>r.roomType===kind&&r.died)])),
  firstRoomMeanLossPct:first.length?Number((first.reduce((t,r)=>t+100*(r.hpStart-r.hpEnd)/r.hpMax,0)/first.length).toFixed(1)):null,
  firstRoomFreshMeanLossPct:(()=>{
   const fresh=aa.map(a=>a.attempts?.[0]?.rooms?.[0]).filter(Boolean);
   return fresh.length?Number((fresh.reduce((t,r)=>t+100*(r.hpStart-r.hpEnd)/r.hpMax,0)/fresh.length).toFixed(1)):null;
  })(),
  extractionReasons:reasons,byLevel:perLevel,byAccount:aa.map(accountDigest)};
}
function parse(argv=process.argv.slice(2)){
 const opts={mode:'baseline',out:'reports/v013-stage621-baseline.json',
  seeds:'9701,9702',profiles:'cautious,balanced,magic-fire',maxLevel:3,
  maxAttempts:8,maxTotalAttempts:16};
 for(const arg of argv){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);if(!m)throw Error('Bad Stage 6.21 CLI '+arg);
  const [,key,value]=m;
  if(key==='mode')opts.mode=value;
  else if(key==='out')opts.out=value;
  else if(key==='seeds')opts.seeds=value;
  else if(key==='profiles')opts.profiles=value;
  else if(key==='max-level')opts.maxLevel=Number(value);
  else if(key==='max-attempts')opts.maxAttempts=Number(value);
  else if(key==='max-total-attempts')opts.maxTotalAttempts=Number(value);
  else throw Error('Unrecognized Stage 6.21 CLI '+arg);
 }
 if(!MODES.has(opts.mode)||!opts.out.startsWith('reports/')||!opts.out.endsWith('.json')||
    opts.out.includes('..')||opts.maxLevel<2||opts.maxLevel>5||
    opts.maxAttempts<1||opts.maxAttempts>18||
    opts.maxTotalAttempts<1||opts.maxTotalAttempts>30)throw Error('Invalid bounded native Stage 6.21 setup');
 const native=N.parseArgs([
  '--seeds='+opts.seeds,'--profiles='+opts.profiles,'--max-level='+opts.maxLevel,
  '--max-attempts='+opts.maxAttempts,'--max-total-attempts='+opts.maxTotalAttempts,
  '--out='+opts.out
 ]);
 if(native.seeds.length*native.profiles.length>12)throw Error('Too many natural accounts for scoped cohort');
 return {...opts,native};
}
function main(argv=process.argv.slice(2)){
 const o=parse(argv),effectiveSource=
   o.mode==='baseline'?baselineSource():
   o.mode==='candidate'?candidateSource():
   o.mode==='combined'?combinedSource():LIVE_SOURCE;
 const overrides=effectiveSource===LIVE_SOURCE?{}:{moduleOverrides:{[SOURCE_PATH]:effectiveSource}};
 const result=N.run(o.native,overrides);
 const effectiveRuntimeGitBlob=gitBlobSha(effectiveSource);
 const compact=summary(result),out=path.resolve(o.out);
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify({stage:'6.21',mode:o.mode,source:result.source,effectiveRuntimeGitBlob,settings:o.native,
  summary:compact,accounts:result.accounts},null,2)+'\n');
 fs.writeFileSync(out.replace(/\.json$/,'.md'),[
  '# Wanderer Stage 6.21 — persistent E1–E'+o.maxLevel+' native accounts',
  '',
  'No forced loot, XP, save reset, unlock, Boss placement, crafted gear or free potions. Fresh weak E1 gear and zero starting Talent points. Repeated runs keep genuine earned account state.',
  '',
  '**Mode**: '+o.mode,'**Source**: '+result.source,
  '**Accounts**: '+compact.accounts,'**E2 reached**: '+compact.unlockedE2,
  '**E3 reached**: '+compact.unlockedE3,'**Attempts**: '+compact.totalAttempts,
  '**Fights**: '+compact.totalFights,'**Errors**: '+compact.errors,
  '**Fresh first-room HP loss**: '+compact.firstRoomFreshMeanLossPct+'%',
  '',
  '| Level | Reached | Attempts | Boss wins | Boss entries | Extractions | Deaths | Gear upgrades |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...compact.byLevel.map(x=>'| E'+x.level+' | '+x.accountsReached+' | '+x.attempts+' | '+x.wins+
   ' | '+x.bossReached+' | '+x.extractions+' | '+x.deaths+' | '+x.gearUpgrades+' |'),
  '', '## Failure modes',
  '', ...Object.entries(compact.extractionReasons).map(([k,v])=>'- '+k+': '+v),
  '', '## Account outcomes',
  '',...compact.byAccount.map(a=>'- '+a.profile+', seed '+a.seed+': E'+a.unlocked+
   ', attempts '+a.attempts+', points '+a.spentTalents+', last stop: '+a.stop)
 ].join('\n')+'\n');
 console.log('STAGE621='+JSON.stringify({mode:o.mode,source:result.source,effectiveRuntimeGitBlob,
  ...Object.fromEntries(Object.entries(compact).filter(([k])=>k!=='byAccount')),
  byAccount:compact.byAccount.map(a=>({profile:a.profile,seed:a.seed,unlocked:a.unlocked,
   attempts:a.attempts,spentTalents:a.spentTalents,stop:a.stop,
   detail:a.perAttempt.map(p=>({level:p.level,status:p.status,bossReached:p.bossReached,
    bossWon:p.bossWon,deathAt:p.deathAt,extractedFor:p.extractedFor,rooms:p.rooms,
    hpFirst:p.hpFirst,hpAfterFirst:p.hpAfterFirst,
    firstRole:p.firstRole,xp:p.xp,gearDrops:p.gearDrops,
    boss:p.boss}))}))}));
 if(result.coverage.errors)process.exitCode=1;
 return result;
}
if(require.main===module){try{main();}catch(e){console.error('STAGE621_ERROR',e.stack||e);process.exitCode=1;}}
module.exports={parse,summary,accountDigest,main,baselineSource,candidateSource,bossCandidateSource,combinedSource,LIVE_SOURCE,ORIGINAL_ATTACK,EARLY_ATTACK,gitBlobSha,PRE_STAGE621_GIT_BLOB};
