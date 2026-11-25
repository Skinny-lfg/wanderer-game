'use strict';
// Compare to the preserved original E10 run with identical seeds and scenario fingerprints.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const A=require('./v013-anchor-rune-scaling.cjs'),S=require('./simulate-progression.cjs');
require('../combat/v012-combat-core.js');
const f=process.argv[2],dir='reports/anchor-dot-synergy',old=process.argv[3]||'reports/original-anchor';
const selected=['none','single-corruption','trio-1'];
const metric=(rows)=>({n:rows.length,wins:rows.filter(r=>r.won).length,winPct:100*rows.filter(r=>r.won).length/rows.length,meanDps:rows.reduce((s,r)=>s+r.damage/Math.max(.11,r.seconds),0)/rows.length,secondaryDps:rows.reduce((s,r)=>s+r.secondary/Math.max(.11,r.seconds),0)/rows.length,timeouts:rows.filter(r=>r.timeout).length});
fs.mkdirSync(dir,{recursive:true});
if(f==='phantom'){
 const o=JSON.parse(fs.readFileSync(path.join(old,'controlled-fury.json')));assert.equal(o.source,'5f6f93dbf303aa6367f41edbe895bff2208ad4c89485845cec665a80be86c1ac');
 const rows=o.rows.filter(r=>r.arm==='none'),boost=o.rows.filter(r=>r.arm==='single-phantom'),map=new Map(boost.map(r=>[r.sc+'/'+r.i,r]));
 assert.equal(rows.length,300);assert.equal(boost.length,300);
 const chance=rating=>globalThis.WandererV012CombatCore.evasionChance(rating,10,20,.45);
 const data=rows.map(r=>{const b=map.get(r.sc+'/'+r.i);assert.deepEqual(r.match,b.match);return {sc:r.sc,i:r.i,baseRating:r.stats.evasionRating,boostRating:b.stats.evasionRating,baseChance:chance(r.stats.evasionRating),boostChance:chance(b.stats.evasionRating)};});
 const report={n:data.length,atCap:data.filter(r=>r.baseChance>=.45).length,improved:data.filter(r=>r.boostChance>r.baseChance).length,minBase:Math.min(...data.map(r=>r.baseRating)),maxBase:Math.max(...data.map(r=>r.baseRating)),data};
 fs.writeFileSync(path.join(dir,'phantom.json'),JSON.stringify(report));console.log('PHANTOM_DIAGNOSTIC='+JSON.stringify({...report,data:undefined}));
}else{
 assert(['blood','decay','magic'].includes(f));const o=JSON.parse(fs.readFileSync(path.join(old,'controlled-'+f+'.json')));assert.equal(o.source,'5f6f93dbf303aa6367f41edbe895bff2208ad4c89485845cec665a80be86c1ac');assert.equal(o.trials,50);
 const aa=A.arms(f).filter(a=>selected.includes(a.id));assert.equal(aa.length,3);
 const original=new Map(o.rows.filter(r=>selected.includes(r.arm)).map(r=>[r.sc+'/'+r.i+'/'+r.arm,r]));assert.equal(original.size,900);
 const rows=[];for(const sc of A.SC)for(let i=0;i<50;i++)for(const r of A.paired(f,sc,i,aa)){const before=original.get(sc+'/'+i+'/'+r.arm);assert(before);assert.deepEqual(r.match,before.match,'Original scenario drift '+f+' '+sc+' '+i+' '+r.arm);rows.push(r);}
 assert.equal(rows.length,900);const summary={};
 for(const sc of ['all',...A.SC]){summary[sc]={};for(const arm of selected){const rs=rows.filter(r=>r.arm===arm&&(sc==='all'||r.sc===sc)),bs=rs.map(r=>original.get(r.sc+'/'+r.i+'/'+r.arm)),a=metric(bs),b=metric(rs);summary[sc][arm]={before:a,after:b,deltaWinPp:b.winPct-a.winPct,gains:rs.filter((r,i)=>r.won&&!bs[i].won).length,losses:rs.filter((r,i)=>!r.won&&bs[i].won).length};}}
 const result={family:f,originalRun:45592535013,source:S.sourceFingerprint().sha256,n:rows.length,summary,rows};
 fs.writeFileSync(path.join(dir,f+'.json'),JSON.stringify(result));console.log('ANCHOR_DOT_RESULT='+JSON.stringify({family:f,n:rows.length,summary}));
}
