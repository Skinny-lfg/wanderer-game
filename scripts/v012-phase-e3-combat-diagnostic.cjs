'use strict';
const fs=require('node:fs');
const {run}=require('./v012-affinity-combat-sim.cjs');
const cases=[
 ['Battlemage / Orb','Wand','Cloth','Orb','magic'],
 ['Battlemage / no Orb','Wand','Cloth',false,'magic'],
 ['Mage / Staff','Staff','Cloth',false,'magic'],
 ['Assassin / dual','Daggers','Leather','Off-Hand Dagger','blood'],
 ['Assassin / single','Daggers','Leather',false,'blood'],
 ['Tank / Shield','Sword','Plate','Shield','aegis'],
 ['Tank / no Shield','Sword','Plate',false,'aegis'],
 ['Archer','Bow','Leather',false,'fury']
],rows=[];
for(const [build,weapon,armorType,offhandType,family] of cases)for(let i=0;i<30;i++){
 const seed=991100+i*10007;
 let r;try{r=run({E:200,weapon,armorType,offhandType,family,rarity:'Epic',strategy:'triple',routeMode:'planned',runes:true,seed,controlSeed:seed});}
 catch(e){r={error:String(e?.stack||e)};}
 rows.push({build,seedIndex:i,win:!!r.win,error:r.error||null,timeout:!!r.timeout,dps:r.dps||0,damage:r.damage||0,damageReceived:r.damageReceived||0,seconds:r.seconds||0,attacks:r.weaponAttacks||0,incoming:r.incomingAttacks||0,blocks:r.blocks||0,crits:r.criticalHits||0,healing:r.healPerSecond||0,barrier:r.barrierPerSecond||0,first:r.firstFight||null,death:r.deathCause||null,hybrids:r.hybrids||[],talents:r.allPicks||[],routes:r.routes||[]});
}
const summary=cases.map(([build])=>{const a=rows.filter(r=>r.build===build);const mean=k=>Math.round(100*a.reduce((n,r)=>n+r[k],0)/a.length)/100;
return{build,runs:a.length,wins:a.filter(r=>r.win).length,errors:a.filter(r=>r.error||r.timeout).length,meanDps:mean('dps'),meanDamageReceived:mean('damageReceived'),meanSeconds:mean('seconds'),meanAttacks:mean('attacks'),meanIncoming:mean('incoming'),meanBlocks:mean('blocks'),meanCrits:mean('crits'),initial:a[0].first};});
fs.writeFileSync(process.argv[2]||'/tmp/e3.json',JSON.stringify({rows,summary}));
for(const s of summary)console.log('E3_COMBAT '+JSON.stringify(s));
if(summary.some(s=>s.errors))process.exitCode=1;
