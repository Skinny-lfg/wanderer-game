// Synthetic gear-matched A/B for twelve proposed Legendary effects, using the real VM combat engine.
// No production legendary items are registered; proposed effects exist ONLY in VM-injected combat hooks.
const fs=require('node:fs'),{performance}=require('node:perf_hooks'),{run}=require('./v012-affinity-combat-sim.cjs');
const variants=[
 {name:'Cloth Staff',group:'Cloth: Magic/Aegis/Decay',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],weapon:'Staff',offhandType:null,
  legendary:{weapon:'astrafall',belt:'veil-thousand-seals',ring1:'eye-of-morrow'}},
 {name:'Cloth Wand + Orb',group:'Cloth: Magic/Aegis/Decay',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],weapon:'Wand',offhandType:'Orb',
  legendary:{weapon:'voidglass',belt:'veil-thousand-seals',ring1:'eye-of-morrow'}},
 {name:'Plate Sword + Shield',group:'Plate: Vitality/Aegis/Fury',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],weapon:'Sword',offhandType:'Shield',
  legendary:{weapon:'verdant-oath',offhand:'oathwall',armor:'heartroot-carapace'}},
 {name:'Plate Mace + Shield',group:'Plate: Vitality/Aegis/Fury',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],weapon:'Mace',offhandType:'Shield',
  legendary:{weapon:'kingsbreaker',offhand:'oathwall',armor:'heartroot-carapace'}},
 {name:'Leather Daggers',group:'Leather: Decay/Fury/Blood',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weapon:'Daggers',offhandType:'Daggers',
  legendary:{weapon:'crimson-fang',amulet:'chalice-hollow-king',ring1:'eye-of-morrow'}},
 {name:'Leather Bow',group:'Leather: Decay/Fury/Blood',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weapon:'Bow',offhandType:null,
  legendary:{weapon:'tempest-talon',amulet:'chalice-hollow-king',ring1:'eye-of-morrow'}},
 {name:'Leather Two-Handed',group:'Leather: Decay/Fury/Blood',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weapon:'Two-Handed',offhandType:null,
  legendary:{weapon:'gravewake',amulet:'chalice-hollow-king',ring1:'eye-of-morrow'}}
];
const ids=[...new Set(variants.flatMap(v=>Object.values(v.legendary)))];
const expected=['crimson-fang','chalice-hollow-king','gravewake','eye-of-morrow','verdant-oath','heartroot-carapace','oathwall','veil-thousand-seals','kingsbreaker','tempest-talon','astrafall','voidglass'];
if(ids.length!==12||expected.some(id=>!ids.includes(id)))throw Error('Not all twelve proposed legendary effects covered');
const levels=process.env.WANDERER_LEGEND_LEVELS?process.env.WANDERER_LEGEND_LEVELS.split(',').map(Number).filter(n=>[10,50,100,200].includes(n)):[10,50,100,200],rarities=['Rare','Epic'];
const reps=Math.max(1,Math.min(18,Number(process.env.WANDERER_LEGEND_REPS||8)));
const soloReps=Math.max(1,Math.min(12,Number(process.env.WANDERER_LEGEND_SOLO_REPS||4)));
const seedOffset=Number(process.env.WANDERER_LEGEND_SEED_OFFSET||0);
const started=performance.now(),rows=[],failures=[];
const round=(n,d=2)=>+n.toFixed(d),mean=(a,fn)=>a.length?round(a.reduce((s,x)=>s+(Number(fn(x))||0),0)/a.length):null;
const countProcs=(r,id)=>Number(r.prototypeProcCounts?.['Legendary Prototype: '+id]||0);
function execute(variant,E,rarity,rep,mode,idsOn){
 const seed=(6201020+seedOffset+E*1103+variants.indexOf(variant)*181+rarities.indexOf(rarity)*611+rep*100003)>>>0;
 const cfg={...variant,E,rarity,seed,strategy:'triple',runes:true,prototypeItems:idsOn};
 delete cfg.legendary;
 try{
  const r=run(cfg);
  rows.push({...r,variant:variant.name,group:variant.group,mode,rep,activeIds:Object.values(idsOn)});
  if(r.error||r.timeout)failures.push({variant:variant.name,E,rarity,rep,mode,error:r.error,timeout:r.timeout});
 }catch(e){failures.push({variant:variant.name,E,rarity,rep,mode,error:String(e?.stack||e)});}
}
for(const E of levels)for(const variant of variants)for(const rarity of rarities)for(let rep=0;rep<reps;rep++){
 execute(variant,E,rarity,rep,'baseline',{});
 execute(variant,E,rarity,rep,'three_legendaries',variant.legendary);
 if(rows.length%160===0)process.stderr.write('Legendary test completed '+rows.length+' runs\n');
}
for(const variant of variants)for(const [slot,id]of Object.entries(variant.legendary))
 for(const E of [50,200])for(const rarity of rarities)for(let rep=0;rep<soloReps;rep++){
  execute(variant,E,rarity,rep,'solo:'+id,{});
  execute(variant,E,rarity,rep,'single:'+id,{[slot]:id});
 }
function summarize(items){
 const n=items.length,wins=items.filter(r=>r.win).length;
 const procs=Object.fromEntries(expected.map(id=>[id,items.reduce((s,r)=>s+countProcs(r,id),0)]).filter(([,n])=>n>0));
 return {n,wins,winPct:n?round(wins/n*100,1):0,meanRealm:mean(items,r=>r.reached),meanDps:mean(items,r=>r.dps),meanHealSec:mean(items,r=>r.healPerSecond),
 meanBarrierSec:mean(items,r=>r.barrierPerSecond),allThreeUnlocked:items.filter(r=>r.allTargetsUnlocked).length,
 maxHP:mean(items,r=>r.firstFight?.playerMaxHP),attack:mean(items,r=>r.firstFight?.playerAttack),
 procs,errors:items.filter(r=>r.error).length,timeouts:items.filter(r=>r.timeout).length};
}
const full=[];
for(const E of levels)for(const variant of variants){
 const b=rows.filter(r=>r.E===E&&r.variant===variant.name&&r.mode==='baseline'),l=rows.filter(r=>r.E===E&&r.variant===variant.name&&r.mode==='three_legendaries');
 const key=r=>r.E+'|'+r.rarity+'|'+r.rep;
 const map=new Map(b.map(r=>[key(r),r]));let winGained=0,winLost=0,realmImproved=0,realmWorse=0;
 for(const r of l){const v=map.get(key(r));if(!v)continue; if(r.win&&!v.win)winGained++;if(!r.win&&v.win)winLost++;if(r.reached>v.reached)realmImproved++;if(r.reached<v.reached)realmWorse++;}
 full.push({E,variant:variant.name,group:variant.group,legendary:Object.values(variant.legendary),baseline:summarize(b),legendaries:summarize(l),paired:{winGained,winLost,realmImproved,realmWorse}});
}
const grouped=[];
for(const E of levels)for(const group of [...new Set(variants.map(v=>v.group))]){
 const v=full.filter(r=>r.E===E&&r.group===group);
 grouped.push({E,group,n:v.reduce((s,x)=>s+x.baseline.n,0),baselineWins:v.reduce((s,x)=>s+x.baseline.wins,0),legendWins:v.reduce((s,x)=>s+x.legendaries.wins,0),
 baselineRealm:mean(v,r=>r.baseline.meanRealm),legendRealm:mean(v,r=>r.legendaries.meanRealm),
 baselineDps:mean(v,r=>r.baseline.meanDps),legendDps:mean(v,r=>r.legendaries.meanDps)});
}
const single=[];
for(const variant of variants)for(const [slot,id]of Object.entries(variant.legendary))for(const E of [50,200]){
 const b=rows.filter(r=>r.variant===variant.name&&r.E===E&&r.mode==='solo:'+id),l=rows.filter(r=>r.variant===variant.name&&r.E===E&&r.mode==='single:'+id);
 single.push({E,variant:variant.name,id,slot,baseline:summarize(b),single:summarize(l)});
}
const meta={cases:rows.length,failures:failures.length,wallSeconds:round((performance.now()-started)/1000),levels,reps,soloReps,seedOffset,
 assumptions:'Real native combat/gear/draft in isolated VM, all 12 proposed effects test-only, native formula preserved. Equipped prototypes do NOT get additional Legendary rarity base stats or old +32% damage fallback. Same full Rare/Epic gear stats/seed both arms. Three same-tier runes; no potions, events declined, no mid-run upgrades; targeting legitimate 3-family offers. Simulation uses original armor speed/evasion, not hypothetical rebalance. Ability-specific cooldown across waves follows native cooldown model. Outcomes depend on spell and affinity unlocking. 15 Realms.'};
const data={meta,full,grouped,single,failures:failures.slice(0,25)};
fs.writeFileSync(process.argv[2]||'/tmp/wanderer-v012-legendary-test.json',JSON.stringify({data,rows})+'\n');
console.log('LEGENDARY_TEST_SUMMARY_BEGIN');
console.log(JSON.stringify(data));
console.log('LEGENDARY_TEST_SUMMARY_END');
if(failures.length)process.exitCode=1;
