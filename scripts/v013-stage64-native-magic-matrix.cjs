'use strict';
// Stage 6.4 diagnostic: legally allocated synthetic builds, native combat,
// identical seeded gear & roster across baseline and candidate worktrees.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.env.STAGE64_NATIVE_ROOT;
const S=require(root?path.resolve(root,'scripts/simulate-progression.cjs'):'./simulate-progression.cjs');
const Profiles=require('./v013-stage63-native-magic-matrix.cjs').PROFILES;
const avg=values=>values.length?+(values.reduce((x,y)=>x+y,0)/values.length).toFixed(2):null;
const ENCOUNTERS=[{id:'group-3',kind:'normal',count:3,risk:1},{id:'group-10',kind:'normal',count:10,risk:1},
 {id:'boss-aegis',kind:'boss',family:'aegis',risk:1},{id:'boss-decay',kind:'boss',family:'decay',risk:1}];
const BOSS_BUILDS=new Set(['arcane-sword','arcane-wand','arcane-staff','arcane-decay-wand']);
const OPTIONS=Object.freeze({levels:[5,35],seeds:[9201,9202],points:24,gear:'current',rarity:'Rare',runes:false,
 targetPolicy:'mechanics',measure:true,lockScenarioStreams:true,boons:'none',contracts:'none',tickLimit:2700});
function run(){
 const rows=[],errors=[],count=OPTIONS.levels.length*OPTIONS.seeds.length*(Profiles.length*2+BOSS_BUILDS.size*2);
 for(const level of OPTIONS.levels)for(const seed of OPTIONS.seeds)for(const enc of ENCOUNTERS){
  const available=enc.kind==='boss'?Profiles.filter(b=>BOSS_BUILDS.has(b.id)):Profiles;
  for(const build of available){
   try{
    const o={...S.DEFAULTS,...OPTIONS};
    const r=S.encounter(level,build,seed,enc.kind,o,undefined,undefined,enc.family,enc.risk,enc.kind==='normal'?enc.count:undefined);
    if(r.error||!['cleared','died','timeout'].includes(r.status))throw Error('Bad native status '+r.status+'/'+r.error);
    if(r.pointsSpent!==OPTIONS.points)throw Error('Legal 24-point allocation did not finish');
    const rosterHash=crypto.createHash('sha256').update(JSON.stringify(r.roster)).digest('hex');
    rows.push({key:[level,seed,enc.id,build.id].join(':'),level,seed,encounter:enc.id,mode:build.mode,weapon:build.weapon,build:build.id,
     status:r.status,won:r.won,died:r.died,timedOut:r.timedOut,seconds:r.seconds,
     damageDealt:r.damageDealt,damageTaken:r.damageTaken,dps:r.seconds>0?+(r.damageDealt/r.seconds).toFixed(2):0,
     hpMax:r.hpMax,hpEnd:r.hpEnd,mpStart:r.mpStart,mpMax:r.mpMax,mpEnd:r.mpEnd,
     manaSpent:r.manaSpent,infusionActivations:r.infusionActivations||0,infusionHits:r.infusionHits||0,
     infusionDamage:r.infusionDamage||0,fundedCasts:r.fundedCasts||0,
     unfundedCasterAttacks:r.unfundedCasterAttacks||0,
     gearFingerprint:r.gearFingerprint,pointsSpent:r.pointsSpent,realm:r.realm,risk:r.risk,
     groupSize:r.groupSize,rosterHash,
     bossId:r.bossId||null});
   }catch(error){errors.push({level,seed,encounter:enc.id,build:build.id,message:String(error.stack||error).slice(0,1400)});}
  }
 }
 const names=[...new Set(rows.map(x=>[x.level,x.encounter,x.mode,x.weapon].join('|')))];
 const groups=names.map(key=>{
  const entries=rows.filter(x=>[x.level,x.encounter,x.mode,x.weapon].join('|')===key),r=entries[0];
  return {key,level:r.level,encounter:r.encounter,mode:r.mode,weapon:r.weapon,n:entries.length,
   wins:entries.filter(x=>x.won).length,deaths:entries.filter(x=>x.died).length,timeouts:entries.filter(x=>x.timedOut).length,
   dps:avg(entries.map(x=>x.dps)),damageTaken:avg(entries.map(x=>x.damageTaken)),
   manaSpent:avg(entries.map(x=>x.manaSpent)),infusionDamage:avg(entries.map(x=>x.infusionDamage)),
   infusionHits:avg(entries.map(x=>x.infusionHits)),fallbacks:avg(entries.map(x=>x.unfundedCasterAttacks)),
   hpEnd:avg(entries.map(x=>x.hpEnd)),seconds:avg(entries.map(x=>x.seconds))};
 });
 const report={stage:'6.4',type:'matched-synthetic-native-combat',
  sourceRevision:process.env.STAGE64_NATIVE_ROOT?'worktree:'+root:'current',
  config:{levels:OPTIONS.levels,seeds:OPTIONS.seeds,points:OPTIONS.points,rarity:OPTIONS.rarity,
   risk:1,targetPolicy:OPTIONS.targetPolicy,encounters:ENCOUNTERS},
  rows,groups,errors,success:errors.length===0&&rows.length===count,
  limitations:['These are synthetic builds with 24 legally purchased talent points, not naturally earned Expedition accounts.',
   'The enemy scheduler, equipment, damage and Mana economy are native, but first-room encounters are controlled fixtures.',
   'Comparisons fix initial gear, roster and seeds; procedural combat RNG can diverge as spells, hits and deaths diverge.',
   'Only two seeds per cell; winning a staged Boss fight is not equivalent to clearing a whole Expedition.']};
 const dest=path.resolve(process.env.STAGE64_REPORT_FILE||'reports/stage64-native-arcane.json');
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 console.log('STAGE64_NATIVE='+JSON.stringify({success:report.success,cases:rows.length,expected:count,errors:errors.slice(0,3),
  highlight:groups.filter(g=>g.level===35&&['arcane','fire','lightning','arcane-decay'].includes(g.mode)&&['Sword','Wand','Staff'].includes(g.weapon))
  .map(g=>({encounter:g.encounter,mode:g.mode,weapon:g.weapon,wins:g.wins,n:g.n,dps:g.dps,mana:g.manaSpent,infusion:g.infusionDamage,fallbacks:g.fallbacks}))}));
 if(!report.success)process.exitCode=1;return report;
}
if(require.main===module)run();
module.exports={run,PROFILES:Profiles,ENCOUNTERS,OPTIONS};
