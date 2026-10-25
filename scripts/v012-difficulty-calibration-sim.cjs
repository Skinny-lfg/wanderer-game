// B.2 calibration only: applies experimental enemy HP/Attack multipliers in memory.
// The native combat engine, loot and production RNG remain unchanged.
const fs=require('node:fs'),crypto=require('node:crypto'),{performance}=require('node:perf_hooks');
const {run}=require('./v012-affinity-combat-sim.cjs');
const levels=[10,50,100,200],policies=['triple','random'],seeds=64;
const builds=[
 {name:'Cloth Staff',weapon:'Staff',armorType:'Cloth',offhandType:null},
 {name:'Cloth Wand + Orb',weapon:'Wand',armorType:'Cloth',offhandType:'Orb'},
 {name:'Plate Sword + Shield',weapon:'Sword',armorType:'Plate',offhandType:'Shield'},
 {name:'Plate Mace + Shield',weapon:'Mace',armorType:'Plate',offhandType:'Shield'},
 {name:'Leather Dual Daggers',weapon:'Daggers',armorType:'Leather',offhandType:'Off-Hand Dagger'},
 {name:'Leather Bow',weapon:'Bow',armorType:'Leather',offhandType:null},
 {name:'Leather Two-Handed',weapon:'Two-Handed',armorType:'Leather',offhandType:null}
];
const profiles={
 'A.2':{'Cloth Staff':['magic','aegis','decay'],'Cloth Wand + Orb':['magic','aegis','decay'],'Plate Sword + Shield':['vitality','aegis','fury'],'Plate Mace + Shield':['vitality','aegis','fury'],'Leather Dual Daggers':['decay','fury','blood'],'Leather Bow':['decay','fury','blood'],'Leather Two-Handed':['decay','fury','blood']},
 'B.1':{'Cloth Staff':['magic','fury','aegis'],'Cloth Wand + Orb':['magic','fury','aegis'],'Plate Sword + Shield':['blood','decay','magic'],'Plate Mace + Shield':['aegis','vitality','fury'],'Leather Dual Daggers':['fury','magic','blood'],'Leather Bow':['fury','magic','blood'],'Leather Two-Handed':['blood','decay','magic']}
};
const anchors={A:[[1,1,1],[10,.95,.95],[50,.90,.92],[100,.97,.97],[200,1,1]],B:[[1,1,1],[10,.90,.92],[50,.82,.87],[100,.95,.95],[200,1,1]],current:[[1,1,1],[200,1,1]]};
function scaleAt(curve,E){const a=anchors[curve];if(E>=200)return {hp:1,attack:1};let i=1;while(i<a.length&&E>a[i][0])i++;const [x0,h0,a0]=a[i-1],[x1,h1,a1]=a[i],t=(E-x0)/(x1-x0),s=t*t*(3-2*t);return {hp:h0+(h1-h0)*s,attack:a0+(a1-a0)*s};}
function mean(rows,key){return +(rows.reduce((n,r)=>n+(typeof key==='function'?key(r):r[key]),0)/rows.length).toFixed(2);}
function summarize(rows){const map=new Map();for(const r of rows){const key=[r.curve,r.profile,r.E,r.buildName,r.strategy].join('|');if(!map.has(key))map.set(key,[]);map.get(key).push(r);}return [...map].map(([key,a])=>{const first=a[0],deaths={};for(const r of a)if(r.deathCause){const d=r.deathCause,c=d.boss?'boss':d.elite?'elite '+d.elite:d.name;deaths[c]=(deaths[c]||0)+1;}const unlocks={};for(const f of ['blood','decay','vitality','aegis','fury','magic']){const values=a.map(r=>r.unlockedAt[f]).filter(Number.isFinite);if(values.length)unlocks[f]={runs:values.length,meanRealm:+(values.reduce((x,y)=>x+y,0)/values.length).toFixed(2)};}return {curve:first.curve,profile:first.profile,E:first.E,build:first.buildName,policy:first.strategy,n:a.length,wins:a.filter(r=>r.win).length,winPct:+(100*a.filter(r=>r.win).length/a.length).toFixed(1),meanRealm:mean(a,'reached'),meanDps:mean(a,'dps'),meanDamageReceived:mean(a,'damageReceived'),meanHealPerSecond:mean(a,'healPerSecond'),meanBarrierPerSecond:mean(a,'barrierPerSecond'),meanUnlockedAffinities:mean(a,r=>r.unlockedFamilies.length),affinities:Object.fromEntries([...new Set(a.flatMap(r=>r.unlockedFamilies))].map(f=>[f,a.filter(r=>r.unlockedFamilies.includes(f)).length])),unlockRealms:unlocks,bossReached:a.filter(r=>r.bossReached).length,bossReachedPct:+(100*a.filter(r=>r.bossReached).length/a.length).toFixed(1),deathCauses:deaths,errors:a.filter(r=>r.error).length,timeouts:a.filter(r=>r.timeout).length};});}
function seedFor(E,bi,pi,rep){return (62000000+E*100003+bi*997+pi*503+rep*17)>>>0;}
const filter={curve:process.env.WANDERER_B2_CURVE,profile:process.env.WANDERER_B2_PROFILE,E:process.env.WANDERER_B2_E?Number(process.env.WANDERER_B2_E):null,buildIndex:process.env.WANDERER_B2_BUILD===undefined?null:Number(process.env.WANDERER_B2_BUILD),policy:process.env.WANDERER_B2_POLICY};
const curves=filter.curve?[filter.curve]:['current','A','B'],profileNames=filter.profile?[filter.profile]:['A.2','B.1'],runLevels=filter.E?[filter.E]:levels,buildIndexes=filter.buildIndex===null?builds.map((_,i)=>i):[filter.buildIndex],runPolicies=filter.policy?[filter.policy]:policies;
if(curves.some(c=>!['current','A','B'].includes(c))||profileNames.some(p=>!profiles[p])||runLevels.some(E=>!levels.includes(E))||buildIndexes.some(i=>!builds[i])||runPolicies.some(p=>!policies.includes(p)))throw Error('Invalid B.2 chunk filter');
const rows=[],start=performance.now(),total=curves.length*profileNames.length*runLevels.length*buildIndexes.length*runPolicies.length*seeds;
for(const curve of curves)for(const profile of profileNames)for(const E of runLevels)for(const bi of buildIndexes){
 const build=builds[bi],target=profiles[profile][build.name],scale=scaleAt(curve,E);
 for(const strategy of runPolicies)for(let rep=0;rep<seeds;rep++){
  const seed=seedFor(E,bi,profile==='B.1'?1:0,rep);
  const r=run({E,...build,buildName:build.name,rarity:'Epic',family:target[0],targetFamilies:target,strategy,runes:true,seed,controlSeed:seed,enemyScale:scale,curve,profile});
  rows.push({E,curve,profile,buildName:build.name,strategy,seed,win:r.win,reached:r.reached,dps:r.dps,damageReceived:r.damageReceived,healPerSecond:r.healPerSecond,barrierPerSecond:r.barrierPerSecond,unlockedFamilies:r.unlockedFamilies,unlockedAt:r.unlockedAt,bossReached:r.bossReached,deathCause:r.deathCause,error:r.error,timeout:r.timeout});
  if(rows.length%32===0)global.gc?.();
  if(rows.length%896===0)process.stderr.write(`completed ${rows.length}/${total}\n`);
 }
}
const result={type:'v012-phase-b2-in-memory-difficulty-calibration-chunk',baseCommit:'62519a0',cases:rows.length,seedsPerBuildPolicyProfileCurveLevel:seeds,levels,policies,curves:anchors,interpolation:'Cubic smoothstep between anchors; E1 is 100%, factors return to 100% at E200 and remain 100% so the original E>=200 formula is preserved.',profiles,builds,conditions:'Epic gear for all equipped slots; 3 equivalent permanent runes (Vitality, Warding, Wisdom for Staff/Wand, Might for other weapons); no potions, new Legendaries, gear swaps or event benefits. Combat, route/draft and control RNG streams are independently seeded; each curve reuses paired seeds within the same build/profile/level/policy. HP and Attack are scaled once on each generated enemy; Defense and equipment are unchanged. Simulation is run from a clean archive of B.1 commit 62519a0, excluding worktree UX changes.',seedScheme:'62000000 + E*100003 + buildIndex*997 + profileIndex*503 + replicate*17; independent harness streams derive from this seed.',sourceHashes:{enemyRuntime:crypto.createHash('sha256').update(fs.readFileSync('combat/v012-combat-runtime.js')).digest('hex'),buildcraft:crypto.createHash('sha256').update(fs.readFileSync('combat/v012-buildcraft.js')).digest('hex'),controller:crypto.createHash('sha256').update(fs.readFileSync('online/v012-expedition-controller.js')).digest('hex')},wallSeconds:+((performance.now()-start)/1000).toFixed(1),groups:summarize(rows),rows};
const out=process.argv[2]||'/tmp/v012-phase-b2-calibration-chunk.json';fs.writeFileSync(out,JSON.stringify(result)+'\n');console.log(JSON.stringify({cases:rows.length,wallSeconds:result.wallSeconds,errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timeout).length,out}));if(rows.some(r=>r.error||r.timeout))process.exitCode=1;
