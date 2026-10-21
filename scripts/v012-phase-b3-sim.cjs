// B.3 experiments only. Native production modules are patched in VM memory.
const fs=require('node:fs'),path=require('node:path'),{run}=require('./v012-affinity-combat-sim.cjs');
const builds=[
 {name:'Staff',weapon:'Staff',armorType:'Cloth',profiles:[['magic','aegis','decay'],['magic','aegis','vitality']]},
 {name:'Wand + Orb',weapon:'Wand',armorType:'Cloth',offhandType:'Orb',profiles:[['magic','aegis','decay'],['magic','aegis','vitality']],variant:'wand'},
 {name:'Sword + Shield',weapon:'Sword',armorType:'Plate',offhandType:'Shield',profiles:[['vitality','aegis','fury'],['blood','decay','magic']],variant:'sword'},
 {name:'Mace + Shield',weapon:'Mace',armorType:'Plate',offhandType:'Shield',profiles:[['vitality','aegis','fury']]},
 {name:'Dual Daggers',weapon:'Daggers',armorType:'Leather',offhandType:'Off-Hand Dagger',profiles:[['decay','fury','blood'],['blood','decay','vitality']],variant:'daggers'},
 {name:'Bow',weapon:'Bow',armorType:'Leather',profiles:[['decay','fury','blood'],['fury','magic','blood']],variant:'bow'},
 {name:'Two-Handed',weapon:'Two-Handed',armorType:'Leather',profiles:[['decay','fury','blood'],['blood','decay','magic']],variant:'twohanded'}
];
const specs={
 wand:['economy/v012-equipment-runtime.js','else if(slot===\'offhand\'){o.spell=power;','else if(slot===\'offhand\'){o.spell=Math.round(power*1.12);'],
 sword:['combat/v012-combat-runtime.js',"ports.setDirectEnemyDamage(r,base*.45,'🛡 Shield Counterattack');","ports.setDirectEnemyDamage(r,base*(s.main.subtype==='Sword'?.65:.45),'🛡 Shield Counterattack');"],
 daggers:['combat/v012-combat-runtime.js','if(ports.tryDodge(r,ports.enemyAttackType(e))){ports.animateEnemyStrike();}',"if(ports.tryDodge(r,ports.enemyAttackType(e))){if(ports.enemyAttackType(e)==='physical'&&s.main?.subtype==='Daggers'&&ports.setReady(r,'daggerEvasionBarrier',6))ports.setBarrier(r,r.maxhp*.03);ports.animateEnemyStrike();}"],
 bow:['economy/v012-equipment-runtime.js','Math.round(power*1.18)+5','Math.round(power*1.12)+5'],
 twohanded:['economy/v012-equipment-runtime.js','Math.round(power*1.75)+7','Math.round(power*1.65)+7']
};
function overridesFor(variant){if(!variant)return {};const [file,from,to]=specs[variant],source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');if(source.split(from).length!==2)throw Error('Expected one B.3 patch point: '+variant);return {[file]:source.replace(from,to)};}
function seedFor(E,bi,policy,rep){return (63000000+E*100003+bi*997+(policy==='random'?503:0)+rep*17)>>>0;}
function compact(r,variant,profileIndex,rep){return {variant,profileIndex,rep,E:r.E,build:r.buildName,policy:r.strategy,seed:r.seed,win:r.win,realm:r.reached,dps:r.dps,hpRemaining:r.hp,maxhp:r.maxhp,damageReceived:r.damageReceived,healPerSecond:r.healPerSecond,barrierPerSecond:r.barrierPerSecond,observedEhpBudget:r.observedEhpBudget,weaponAttacks:r.weaponAttacks,seconds:r.seconds,bossReached:r.bossReached,deathCause:r.deathCause,unlockedFamilies:r.unlockedFamilies,routes:r.routes,passives:r.allPicks,error:r.error,timeout:r.timeout};}
function chunk(E,bi,policy,profileIndex,mode){const build=builds[bi];if(!build||!build.profiles[profileIndex]||![50,100,200].includes(E)||!['triple','random'].includes(policy)||!['control','candidate'].includes(mode)||mode==='candidate'&&!build.variant)throw Error('Invalid B.3 chunk');const target=build.profiles[profileIndex],variant=mode==='candidate'?build.variant:null,overrides=overridesFor(variant),rows=[];for(let rep=0;rep<64;rep++){const seed=seedFor(E,bi,policy,rep),r=run({E,weapon:build.weapon,armorType:build.armorType,offhandType:build.offhandType,buildName:build.name,rarity:'Epic',family:target[0],targetFamilies:target,strategy:policy,runes:true,seed,controlSeed:seed,moduleOverrides:overrides});rows.push(compact(r,mode,profileIndex,rep));}return rows;}
if(require.main===module){const [E,bi,policy,profileIndex,mode,out]=process.argv.slice(2);const rows=chunk(Number(E),Number(bi),policy,Number(profileIndex),mode);fs.writeFileSync(out,JSON.stringify({E:Number(E),buildIndex:Number(bi),policy,profileIndex:Number(profileIndex),mode,rows})+'\n');const failures=rows.filter(r=>r.error||r.timeout);process.stdout.write(JSON.stringify({out,cases:rows.length,failures:failures.length})+'\n');if(failures.length)process.exitCode=1;}
module.exports={builds,specs,seedFor,overridesFor,chunk};
