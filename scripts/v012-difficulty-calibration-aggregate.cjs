const fs=require('node:fs'),path=require('node:path');
const dir=process.argv[2]||'/tmp/v012-phase-b2-chunks',out=process.argv[3]||'/tmp/v012-phase-b2-calibration-clean.json';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort();if(files.length!==336)throw Error(`Expected 336 chunks, found ${files.length}`);
const chunks=files.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))),meta=chunks[0],rows=chunks.flatMap(c=>c.rows);
if(rows.length!==21504)throw Error(`Expected 21504 runs, found ${rows.length}`);
const seen=new Set();for(const r of rows){const k=[r.curve,r.profile,r.E,r.buildName,r.strategy,r.seed].join('|');if(seen.has(k))throw Error('Duplicate paired seed '+k);seen.add(k);}
const avg=(a,k)=>+(a.reduce((n,r)=>n+r[k],0)/a.length).toFixed(2);
const groups=new Map();for(const r of rows){const key=[r.curve,r.profile,r.E,r.buildName,r.strategy].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
const summaries=[...groups.values()].map(a=>{const z=a[0],deaths={},unlocks={};for(const r of a){if(r.deathCause){const d=r.deathCause,c=d.boss?'boss':d.elite?'elite '+d.elite:d.name;deaths[c]=(deaths[c]||0)+1;}for(const f of r.unlockedFamilies){if(!unlocks[f])unlocks[f]={runs:0,realmSum:0};unlocks[f].runs++;unlocks[f].realmSum+=r.unlockedAt[f]??0;}}
 for(const v of Object.values(unlocks))v.meanRealm=+(v.realmSum/Math.max(1,v.runs)).toFixed(2),delete v.realmSum;
 return {curve:z.curve,profile:z.profile,E:z.E,build:z.buildName,policy:z.strategy,n:a.length,wins:a.filter(r=>r.win).length,winPct:+(100*a.filter(r=>r.win).length/a.length).toFixed(1),meanRealm:avg(a,'reached'),meanDps:avg(a,'dps'),meanDamageReceived:avg(a,'damageReceived'),meanHealPerSecond:avg(a,'healPerSecond'),meanBarrierPerSecond:avg(a,'barrierPerSecond'),meanUnlockedAffinities:avg(a,r=>r.unlockedFamilies.length),affinities:unlocks,bossReached:a.filter(r=>r.bossReached).length,bossReachedPct:+(100*a.filter(r=>r.bossReached).length/a.length).toFixed(1),deathCauses:deaths,errors:a.filter(r=>r.error).length,timeouts:a.filter(r=>r.timeout).length};
});
const result={...meta,type:'v012-phase-b2-in-memory-difficulty-calibration',cases:rows.length,groups:summaries,rows};fs.writeFileSync(out,JSON.stringify(result)+'\n');console.log(JSON.stringify({chunks:files.length,cases:rows.length,groups:summaries.length,errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timeout).length,out}));
