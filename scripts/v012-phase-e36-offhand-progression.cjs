'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const simulator=path.resolve(__dirname,'v012-affinity-combat-sim.cjs');
let src=fs.readFileSync(simulator,'utf8');
const marker="potionUses,potionCount:potionUses.length,";
if(!src.includes(marker))throw Error('Simulator return anchor missing');
src=src.replace(marker,"potionUses,potionCount:potionUses.length,e35:{mainHits:metrics.e35MainHits||0,offHits:metrics.e35OffHits||0,mainDamage:metrics.e35MainDamage||0,offDamage:metrics.e35OffDamage||0,shieldCounters:metrics.e35ShieldCounters||0,shieldCounterDamage:metrics.e35ShieldCounterDamage||0,orbWards:metrics.e35OrbWards||0,orbBarrier:metrics.e35OrbBarrier||0},");
const m=new Module(simulator,module);m.filename=simulator;m.paths=Module._nodeModulePaths(path.dirname(simulator));m._compile(src,simulator);
const runtimePath='combat/v012-combat-runtime.js';
let runtime=fs.readFileSync(path.resolve(__dirname,'..',runtimePath),'utf8');
function inject(old,replace){if(!runtime.includes(old))throw Error('Missing combat anchor '+old);runtime=runtime.replace(old,replace);}
inject("const real=Math.max(0,Math.min(e.hp,damage));","const real=Math.max(0,Math.min(e.hp,damage));ports.phase6Metric(r,offhandStrike?'e35OffHits':'e35MainHits',1);ports.phase6Metric(r,offhandStrike?'e35OffDamage':'e35MainDamage',Math.max(0,Math.min(e.hp,damage)));");
inject("ports.setDirectEnemyDamage(r,base*(s.main.subtype==='Sword'?.65:.45),'🛡 Shield Counterattack');","ports.phase6Metric(r,'e35ShieldCounters',1);ports.phase6Metric(r,'e35ShieldCounterDamage',Math.max(0,Math.round(base*(s.main.subtype==='Sword'?.65:.45))));ports.setDirectEnemyDamage(r,base*(s.main.subtype==='Sword'?.65:.45),'🛡 Shield Counterattack');");
inject("if(gained>0)ports.addLog('🔮 Orb Ward +'+Math.round(gained)+' Barrier','good');","if(gained>0){ports.phase6Metric(r,'e35OrbWards',1);ports.phase6Metric(r,'e35OrbBarrier',gained);ports.addLog('🔮 Orb Ward +'+Math.round(gained)+' Barrier','good');}");
const cases=[['Dual 50%','Daggers','Leather','Off-Hand Dagger','blood',50],['Dual 35%','Daggers','Leather','Off-Hand Dagger','blood',35],['Archer','Bow','Leather',false,'fury',35]];const levels=[50,100,150,200];
const rows=[];
for(const E of levels)for(const [build,weapon,armorType,offhandType,family,offPct]of cases)for(let i=0;i<100;i++){
 const seed=991100+i*10007;
 let result;try{const modified=runtime.replace('if(offhandStrike)damage=Math.max(1,Math.round(damage*.35));',`if(offhandStrike)damage=Math.max(1,Math.round(damage*${offPct/100}));`);if(modified===runtime&&offPct!==35)throw Error('Offhand multiplier anchor missing');result=m.exports.run({E,weapon,armorType,offhandType,family,rarity:'Epic',strategy:'triple',routeMode:'planned',runes:true,seed,controlSeed:seed,moduleOverrides:{[runtimePath]:modified}});}catch(e){result={error:e.stack||String(e)};}
 rows.push({E,build,seedIndex:i,win:!!result.win,error:result.error||null,timeout:!!result.timeout,dps:result.dps||0,damage:result.damage||0,received:result.damageReceived||0,...result.e35});
}
const keys=['mainHits','offHits','mainDamage','offDamage','shieldCounters','shieldCounterDamage','orbWards','orbBarrier'];
const summary=levels.flatMap(E=>cases.map(([build])=>{const a=rows.filter(x=>x.E===E&&x.build===build),total=k=>a.reduce((v,x)=>v+(x[k]||0),0);return{E,build,runs:a.length,wins:a.filter(x=>x.win).length,errors:a.filter(x=>x.error||x.timeout).length,avgDps:Math.round(a.reduce((v,x)=>v+x.dps,0)/a.length),...Object.fromEntries(keys.map(k=>[k,total(k)]))};}));
for(const o of summary)console.log('E36_BREAKDOWN '+JSON.stringify(o));
const output=process.argv[2]||'/tmp/e36.json';fs.writeFileSync(output,JSON.stringify({rows,summary}));
if(summary.some(x=>x.errors))process.exitCode=1;
