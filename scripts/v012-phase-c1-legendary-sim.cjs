// Production Legendary effects with Epic-equivalent gear, deterministic combat/route streams.
const fs=require('node:fs'),{run}=require('./v012-affinity-combat-sim.cjs');
const builds=[
 {name:'Cloth Staff',weapon:'Staff',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],one:{weapon:'astrafall'},three:{weapon:'astrafall',armor:'heartroot-carapace',belt:'veil-thousand-seals'}},
 {name:'Cloth Wand + Orb',weapon:'Wand',offhandType:'Orb',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],one:{weapon:'voidglass'},three:{weapon:'voidglass',armor:'heartroot-carapace',belt:'veil-thousand-seals'}},
 {name:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],one:{weapon:'verdant-oath'},three:{weapon:'verdant-oath',offhand:'oathwall',belt:'veil-thousand-seals'}},
 {name:'Plate Mace + Shield',weapon:'Mace',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],one:{weapon:'kingsbreaker'},three:{weapon:'kingsbreaker',offhand:'oathwall',armor:'heartroot-carapace'}},
 {name:'Leather Dual Daggers',weapon:'Daggers',offhandType:'Daggers',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],one:{weapon:'crimson-fang'},three:{weapon:'crimson-fang',amulet:'chalice-hollow-king',armor:'heartroot-carapace'}},
 {name:'Leather Bow',weapon:'Bow',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],one:{weapon:'tempest-talon'},three:{weapon:'tempest-talon',armor:'heartroot-carapace',belt:'veil-thousand-seals'}},
 {name:'Leather Two-Handed',weapon:'Two-Handed',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],one:{weapon:'gravewake'},three:{weapon:'gravewake',ring1:'eye-of-morrow',belt:'veil-thousand-seals'}}
];
const levels=process.env.C1_LEVELS?process.env.C1_LEVELS.split(',').map(Number):[10,50,100,200],policies=['triple','random'],seeds=Number(process.env.C1_SEEDS||64),rows=[];
const path=process.argv[2]||'/tmp/v012-phase-c1-results.json';
for(const E of levels)for(const b of builds)for(const strategy of policies)for(let seed=0;seed<seeds;seed++)for(const count of [0,1,3]){
 const profile=count===0?null:count===1?b.one:b.three;
 const result=run({E,weapon:b.weapon,rarity:'Epic',armorType:b.armorType,offhandType:b.offhandType,family:b.family,targetFamilies:b.targetFamilies,strategy,routeMode:'planned',runes:true,seed:20261021+seed,controlSeed:822000+seed*17+E,legendaryItems:profile});
 rows.push({build:b.name,E,strategy,seed,count,unlockedFamilies:result.unlockedFamilies,win:result.win,reached:result.reached,dps:result.dps,healPerSecond:result.healPerSecond,barrierPerSecond:result.barrierPerSecond,legendaryProcCounts:result.legendaryProcCounts,error:result.error,timeout:result.timeout});
 if(rows.length%192===0){fs.writeFileSync(path,JSON.stringify({complete:false,rows})+'\n');process.stderr.write(`C1 ${rows.length}/${levels.length*builds.length*policies.length*seeds*3}\n`);}
}
fs.writeFileSync(path,JSON.stringify({complete:true,seeds,builds:builds.map(b=>b.name),rows})+'\n');
if(rows.some(r=>r.error||r.timeout))process.exitCode=1;
