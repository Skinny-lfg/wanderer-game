// Focused post-rework combat audit, executed only on ephemeral in-memory profiles.
// Uses the canonical native integrated harness and no external profile, Firebase or deployment.
const fs=require('node:fs'),{performance}=require('node:perf_hooks');
const {run}=require('./v012-affinity-combat-sim.cjs');
const plans=[
 {name:'Blood + Decay',family:'blood',hybrids:['plague_rupture','carrion_detonation']},
 {name:'Vitality + Aegis',family:'vitality',hybrids:['sanctuary','guardians_oath']},
 {name:'Fury + Magic',family:'fury',hybrids:['spellblade','spell_surge']}
];
const weapons=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'];
const ELevels=[1,10,50,100,200],strategies=['random','mono','dual'],rarities=['Rare','Epic'];
const repetitions=Math.max(1,Math.min(8,Number(process.env.WANDERER_FOCUS_REPETITIONS||3)));
const limit=Number(process.env.WANDERER_FOCUS_LIMIT||0);
const rows=[],errors=[];const started=performance.now();
const rounded=(v,d=2)=>+v.toFixed(d),sum=(arr,fn)=>arr.reduce((s,v)=>s+(fn(v)||0),0);
const mean=(arr,fn)=>arr.length?sum(arr,fn)/arr.length:0;
function stats(items,plan){
 const n=items.length,wins=items.filter(r=>r.win).length;
 const hybridRuns=items.filter(r=>r.hybrids.some(id=>plan.hybrids.includes(id))).length;
 const proc=items.reduce((n,r)=>n+plan.hybrids.reduce((a,id)=>a+(r.telemetry[id]?.activations||0),0),0);
 return {n,wins,winPct:n?rounded(wins*100/n,1):0,meanRealm:rounded(mean(items,r=>r.reached)),meanDps:rounded(mean(items,r=>r.dps)),
  meanHealPerSecond:rounded(mean(items,r=>r.healPerSecond),3),meanBarrierPerSecond:rounded(mean(items,r=>r.barrierPerSecond),3),
  meanDotDamage:rounded(mean(items,r=>r.dot)),meanPlayerAttacks:rounded(mean(items,r=>r.weaponAttacks)),
  hybridRuns,hybridPct:n?rounded(100*hybridRuns/n,1):0,hybridActivations:proc,hybridProcsPerRun:rounded(proc/Math.max(1,n)),
  bossReached:items.filter(r=>r.bossReached).length,errors:items.filter(r=>r.error).length,timeouts:items.filter(r=>r.timeout).length};
}
function firstFightStats(items){
 const a=items.map(r=>r.firstFight).filter(Boolean);return {n:a.length,
  playerHP:rounded(mean(a,x=>x.playerMaxHP)),playerAttack:rounded(mean(a,x=>x.playerAttack)),playerDefense:rounded(mean(a,x=>x.playerDefense)),
  playerSpeed:rounded(mean(a,x=>x.playerSpeed)),playerCrit:rounded(mean(a,x=>x.playerCrit)),
  enemyHP:rounded(mean(a,x=>x.enemyHP)),enemyAttack:rounded(mean(a,x=>x.enemyAttack)),enemyDefense:rounded(mean(a,x=>x.enemyDefense)),
  enemyInterval:rounded(mean(a,x=>x.enemyInterval))};
}
outer:for(const E of ELevels)for(const plan of plans)for(let wi=0;wi<weapons.length;wi++)for(let ri=0;ri<rarities.length;ri++)for(let repeat=0;repeat<repetitions;repeat++)for(const strategy of strategies)for(const runes of [true,false]){
 const seed=20261020+E*701+wi*43+ri*911+repeat*100003; // matched seed across plans/strategies/runes
 try {
  const out=run({E,weapon:weapons[wi],rarity:rarities[ri],family:plan.family,strategy,runes,seed});
  rows.push({...out,plan:plan.name,repeat});
  if(out.error||out.timeout)errors.push({plan:plan.name,E,weapon:weapons[wi],rarity:rarities[ri],strategy,runes,seed,error:out.error,timeout:out.timeout});
 }catch(e){errors.push({plan:plan.name,E,weapon:weapons[wi],rarity:rarities[ri],strategy,runes,seed,error:String(e?.stack||e)});}
 if(rows.length%300===0)process.stderr.write('Completed '+rows.length+' focused combat simulations\n');
 if(limit&&rows.length>=limit)break outer;
}
const matrix=[];
for(const E of ELevels)for(const plan of plans)for(const runes of [true,false])for(const strategy of strategies){
 const items=rows.filter(r=>r.E===E&&r.plan===plan.name&&r.runes===runes&&r.strategy===strategy);
 if(items.length)matrix.push({E,plan:plan.name,runes,strategy,...stats(items,plan)});
}
const opening=[];
for(const E of ELevels)for(const rarity of rarities)for(const runes of [true,false]){
 const items=rows.filter(r=>r.E===E&&r.rarity===rarity&&r.runes===runes&&r.strategy==='random');
 if(items.length)opening.push({E,rarity,runes,...firstFightStats(items)});
}
const byWeapon=[];
for(const E of [10,50,100,200])for(const weapon of weapons)for(const rarity of rarities){
 const items=rows.filter(r=>r.E===E&&r.weapon===weapon&&r.rarity===rarity&&r.runes&&r.strategy==='dual');
 if(items.length)byWeapon.push({E,weapon,rarity,n:items.length,wins:items.filter(r=>r.win).length,meanRealm:rounded(mean(items,r=>r.reached)),meanDps:rounded(mean(items,r=>r.dps))});
}
const summary={revision:'development (runner should record commit SHA externally)',method:'Native engine, same-tier matched seed, seven weapons, Rare/Epic, six initial family combinations across 3 plans, no potions/events/loot upgrades; 15-Realms; no save access',levels:ELevels,plans:plans.map(p=>p.name),repetitions,
 cases:rows.length,errors:errors.length,timeouts:rows.filter(r=>r.timeout).length,wallSeconds:rounded((performance.now()-started)/1000),
 matrix,opening,byWeapon,failures:errors.slice(0,20)};
const output=process.argv[2]||'/tmp/wanderer-v012-focused-builds.json';
fs.writeFileSync(output,JSON.stringify({summary,rows})+'\n');
console.log('FOCUSED_SIM_SUMMARY_BEGIN');
console.log(JSON.stringify(summary));
console.log('FOCUSED_SIM_SUMMARY_END');
if(errors.length)process.exitCode=1;
