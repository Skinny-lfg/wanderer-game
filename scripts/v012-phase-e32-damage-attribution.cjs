'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const simulator=path.resolve(__dirname,'v012-affinity-combat-sim.cjs');
let src=fs.readFileSync(simulator,'utf8');
const marker="potionUses,potionCount:potionUses.length,";
if(!src.includes(marker))throw Error('Simulator return anchor missing');
src=src.replace(marker,"potionUses,potionCount:potionUses.length,e32:{mainHits:metrics.e32MainHits||0,offHits:metrics.e32OffHits||0,mainDamage:metrics.e32MainDamage||0,offDamage:metrics.e32OffDamage||0,shieldCounters:metrics.e32ShieldCounters||0,shieldCounterDamage:metrics.e32ShieldCounterDamage||0,orbWards:metrics.e32OrbWards||0,orbBarrier:metrics.e32OrbBarrier||0},");
const m=new Module(simulator,module);m.filename=simulator;m.paths=Module._nodeModulePaths(path.dirname(simulator));m._compile(src,simulator);
const runtimePath='combat/v012-combat-runtime.js';
let runtime=fs.readFileSync(path.resolve(__dirname,'..',runtimePath),'utf8');
function inject(old,replace){if(!runtime.includes(old))throw Error('Missing combat anchor '+old);runtime=runtime.replace(old,replace);}
inject("const real=Math.max(0,Math.min(e.hp,damage));","const real=Math.max(0,Math.min(e.hp,damage));ports.phase6Metric(r,offhandStrike?'e32OffHits':'e32MainHits',1);ports.phase6Metric(r,offhandStrike?'e32OffDamage':'e32MainDamage',Math.max(0,Math.min(e.hp,damage)));");
inject("ports.setDirectEnemyDamage(r,base*(s.main.subtype==='Sword'?.65:.45),'🛡 Shield Counterattack');","ports.phase6Metric(r,'e32ShieldCounters',1);ports.phase6Metric(r,'e32ShieldCounterDamage',Math.max(0,Math.round(base*(s.main.subtype==='Sword'?.65:.45))));ports.setDirectEnemyDamage(r,base*(s.main.subtype==='Sword'?.65:.45),'🛡 Shield Counterattack');");
inject("if(gained>0)ports.addLog('🔮 Orb Ward +'+Math.round(gained)+' Barrier','good');","if(gained>0){ports.phase6Metric(r,'e32OrbWards',1);ports.phase6Metric(r,'e32OrbBarrier',gained);ports.addLog('🔮 Orb Ward +'+Math.round(gained)+' Barrier','good');}");
const cases=[['Dual Daggers','Daggers','Leather','Off-Hand Dagger','blood'],['Single Dagger','Daggers','Leather',false,'blood'],['Wand + Orb','Wand','Cloth','Orb','magic'],['Wand only','Wand','Cloth',false,'magic'],['Sword + Shield','Sword','Plate','Shield','aegis'],['Sword only','Sword','Plate',false,'aegis']];
const rows=[];
for(const [build,weapon,armorType,offhandType,family]of cases)for(let i=0;i<30;i++){
 const seed=991100+i*10007;
 let result;try{result=m.exports.run({E:200,weapon,armorType,offhandType,family,rarity:'Epic',strategy:'triple',routeMode:'planned',runes:true,seed,controlSeed:seed,moduleOverrides:{[runtimePath]:runtime}});}catch(e){result={error:e.stack||String(e)};}
 rows.push({build,seedIndex:i,win:!!result.win,error:result.error||null,timeout:!!result.timeout,dps:result.dps||0,damage:result.damage||0,received:result.damageReceived||0,...result.e32});
}
const keys=['mainHits','offHits','mainDamage','offDamage','shieldCounters','shieldCounterDamage','orbWards','orbBarrier'];
const summary=cases.map(([build])=>{const a=rows.filter(x=>x.build===build),total=k=>a.reduce((v,x)=>v+(x[k]||0),0);return{build,runs:a.length,wins:a.filter(x=>x.win).length,errors:a.filter(x=>x.error||x.timeout).length,avgDps:Math.round(a.reduce((v,x)=>v+x.dps,0)/a.length),...Object.fromEntries(keys.map(k=>[k,total(k)]))};});
for(const o of summary)console.log('E32_BREAKDOWN '+JSON.stringify(o));
const output=process.argv[2]||'/tmp/e32.json';fs.writeFileSync(output,JSON.stringify({rows,summary}));
if(summary.some(x=>x.errors))process.exitCode=1;
