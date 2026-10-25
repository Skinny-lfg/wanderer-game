// Phase C.2: real runtime, Epic-equivalent fixed gear, two-Legendary maximum.
// Deterministic paired route/control seeds. Reads/writes only local audit JSON.
// Does not change production coefficients, saves, Firebase or drop tables.
const fs=require('node:fs');
const {run}=require('./v012-affinity-combat-sim.cjs');
const builds=[
 {name:'Cloth Staff',weapon:'Staff',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],weaponItem:{weapon:'astrafall'},def1:{belt:'veil-thousand-seals'},def2:{armor:'heartroot-carapace'}},
 {name:'Cloth Wand + Orb',weapon:'Wand',offhandType:'Orb',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],weaponItem:{weapon:'voidglass'},def1:{belt:'veil-thousand-seals'},def2:{armor:'heartroot-carapace'}},
 {name:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],weaponItem:{weapon:'verdant-oath'},def1:{offhand:'oathwall'},def2:{belt:'veil-thousand-seals'}},
 {name:'Plate Mace + Shield',weapon:'Mace',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],weaponItem:{weapon:'kingsbreaker'},def1:{offhand:'oathwall'},def2:{armor:'heartroot-carapace'}},
 {name:'Leather Dual Daggers',weapon:'Daggers',offhandType:'Daggers',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weaponItem:{weapon:'crimson-fang'},def1:{armor:'heartroot-carapace'},def2:{amulet:'chalice-hollow-king'}},
 {name:'Leather Bow',weapon:'Bow',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weaponItem:{weapon:'tempest-talon'},def1:{belt:'veil-thousand-seals'},def2:{armor:'heartroot-carapace'}},
 {name:'Leather Two-Handed',weapon:'Two-Handed',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],weaponItem:{weapon:'gravewake'},def1:{belt:'veil-thousand-seals'},def2:{armor:'heartroot-carapace'}}
];
const profiles=['none','weapon','def1','weapon+def1','weapon+def2','def1+def2'];
const levels=[50,100,200],policies=['triple','random'],seeds=Number(process.env.C2_SEEDS||64);
const output=process.argv[2]||'/tmp/wanderer-phase-c2-results.json';
const rows=[],bad=[];const merged=(...objects)=>Object.assign({},...objects);
const packageFor=(b,p)=>({
 'none':null,'weapon':b.weaponItem,'def1':b.def1,
 'weapon+def1':merged(b.weaponItem,b.def1),
 'weapon+def2':merged(b.weaponItem,b.def2),
 'def1+def2':merged(b.def1,b.def2)
})[p];
const mean=(rs,key)=>rs.reduce((a,r)=>a+Number(r[key]||0),0)/Math.max(1,rs.length);
const round=(v)=>Math.round(v*100)/100;
const save=(complete)=>fs.writeFileSync(output,JSON.stringify({complete,seeds,levels,policies,profiles,builds:builds.map(b=>b.name),rows})+'\n');
for(const E of levels)for(const b of builds)for(const strategy of policies)for(let seed=0;seed<seeds;seed++){
 for(const profile of profiles){
  try{
   const items=packageFor(b,profile);
   if(items&&Object.keys(items).length>2)throw Error('More than 2 Legendaries');
   const r=run({E,weapon:b.weapon,rarity:'Epic',armorType:b.armorType,offhandType:b.offhandType,
    family:b.family,targetFamilies:b.targetFamilies,strategy,routeMode:'planned',runes:true,
    seed:20261021+seed,controlSeed:822000+seed*17+E,legendaryItems:items});
   const row={E,build:b.name,strategy,seed,profile,ids:items?Object.values(items):[],
    win:r.win,reached:r.reached,dps:r.dps,hp:r.hp,healPerSecond:r.healPerSecond,
    barrierPerSecond:r.barrierPerSecond,observedEhpBudget:r.observedEhpBudget,
    damageReceived:r.damageReceived,bossReached:r.bossReached,
    legendaryProcCounts:r.legendaryProcCounts,error:r.error,timeout:r.timeout};
   rows.push(row);
   if(r.error||r.timeout)bad.push(row);
  }catch(e){const issue={E,build:b.name,strategy,seed,profile,error:String(e&&e.stack||e)};
   bad.push(issue);rows.push(issue);}
 }
 if(rows.length%384===0){save(false);process.stderr.write('C2 '+rows.length+'/'+(levels.length*builds.length*policies.length*seeds*profiles.length)+'\n');}
}
save(true);
const summary=[];
for(const E of levels)for(const b of builds)for(const profile of profiles){
 const rs=rows.filter(r=>r.E===E&&r.build===b.name&&r.profile===profile);
 const procs={};for(const r of rs)for(const [id,count]of Object.entries(r.legendaryProcCounts||{}))procs[id]=(procs[id]||0)+count;
 summary.push({E,build:b.name,profile,n:rs.length,wins:rs.filter(r=>r.win).length,
  realm:round(mean(rs,'reached')),dps:round(mean(rs,'dps')),heal:round(mean(rs,'healPerSecond')),
  barrier:round(mean(rs,'barrierPerSecond')),received:round(mean(rs,'damageReceived')),
  budget:round(mean(rs,'observedEhpBudget')),boss:round(mean(rs,'bossReached')*100),procs});
}
for(const row of summary)console.log('C2_SUMMARY '+JSON.stringify(row));
console.log('C2_TOTAL '+JSON.stringify({runs:rows.length,errors:bad.length,levels,seeds,profiles}));
if(bad.length){console.error('C2_ERRORS '+JSON.stringify(bad.slice(0,5)));process.exitCode=1;}
