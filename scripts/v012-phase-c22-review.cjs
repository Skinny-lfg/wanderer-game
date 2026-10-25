// Validate and summarize the completed C.2.2 paired audit, without simulating.
'use strict';
const fs=require('node:fs');
const {isDeepStrictEqual}=require('node:util');
const [triageFile,confirmFile,c21File,output]=process.argv.slice(2);
if(!triageFile||!confirmFile||!c21File||!output)throw Error('Usage: node scripts/v012-phase-c22-review.cjs TRIAGE CONFIRM C21 OUTPUT');
const triage=JSON.parse(fs.readFileSync(triageFile,'utf8'));
const confirm=JSON.parse(fs.readFileSync(confirmFile,'utf8'));
const c21=JSON.parse(fs.readFileSync(c21File,'utf8'));
function assert(ok,message){if(!ok)throw Error(message);}
for(const [name,data,count]of [['triage',triage,5280],['confirm',confirm,10176]]){
 assert(data.phase==='C2.2'&&data.mode===name&&data.complete,`${name} incomplete`);
 assert(data.rows.length===count,`${name} count ${data.rows.length}/${count}`);
 assert(data.rows.every(r=>!r.error&&!r.timeout),`${name} contains error/timeout`);
 const keys=new Set(data.rows.map(r=>[r.E,r.profile,r.arm,r.policy,r.seed].join('|')));
 assert(keys.size===data.rows.length,`${name} duplicate rows`);
 assert(data.computed+data.reused===count,`${name} accounting mismatch`);
}
assert(c21.phase==='C2.1'&&c21.complete&&c21.rows.length===24192,'Invalid C.2.1 reference');
assert(triage.sourceSha===confirm.sourceSha,'Triaged and confirmed different runtimes');
const key=r=>[r.E,r.profile,r.policy,r.seed,r.arm].join('|');
const full=new Map(confirm.rows.map(r=>[key(r),r]));
const common=['win','reached','dps','heal','barrier','ehp','received','procs'];
let negativePairs=0,negativeDifferences=0;
for(const row of confirm.rows.filter(r=>r.arm.startsWith('sword_veil_')&&
 (r.profile==='sword-none'||!r.profile.startsWith('sword-')))){
 const base=full.get([row.E,row.profile,row.policy,row.seed,'base'].join('|'));
 assert(base,'Missing negative-control baseline');negativePairs++;
 if(common.some(k=>!isDeepStrictEqual(row[k],base[k])))negativeDifferences++;
}
assert(negativePairs===1344&&negativeDifferences===0,`Negative controls ${negativeDifferences}/${negativePairs}`);
const c21Rows=new Map(c21.rows.map(r=>[[r.E,r.build,r.profile,r.policy,r.seed,r.arm].join('|'),r]));
const mappings={
 'sword-none':['none','base'],
 'sword-veil':['veil-thousand-seals','base'],
 'sword-oathwall-veil':['oathwall+veil-thousand-seals','base'],
 'sword-verdant-veil':['verdant-oath+veil-thousand-seals','base']
};
let baselinePairs=0,baselineDifferences=0;
for(const row of confirm.rows.filter(r=>r.arm==='base'&&mappings[r.profile])){
 const [profile,arm]=mappings[row.profile];
 const historical=c21Rows.get([row.E,row.build,profile,row.policy,row.seed,arm].join('|'));
 assert(historical,'Missing C.2.1 baseline');baselinePairs++;
 if(common.some(k=>!isDeepStrictEqual(row[k],historical[k])))baselineDifferences++;
}
assert(baselinePairs===1536&&baselineDifferences===0,`C.2.1 baseline ${baselineDifferences}/${baselinePairs}`);
const buckets=new Map();
for(const row of confirm.rows){const k=[row.E,row.profile,row.arm,row.policy].join('|');if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(row);}
const mean=(rows,k)=>rows.reduce((n,r)=>n+Number(r[k]||0),0)/rows.length;
const round=n=>Math.round(n*100)/100;
const groups=[...buckets].map(([name,rows])=>{
 const [E,profile,arm,policy]=name.split('|');
 const procs={};for(const r of rows)for(const [id,n]of Object.entries(r.procs||{}))procs[id]=(procs[id]||0)+n;
 return {E:Number(E),profile,arm,policy,n:rows.length,wins:rows.filter(r=>r.win).length,
  realm:round(mean(rows,'reached')),dps:round(mean(rows,'dps')),heal:round(mean(rows,'heal')),
  barrier:round(mean(rows,'barrier')),ehp:round(mean(rows,'ehp')),
  received:round(mean(rows,'received')),procs};
});
const paired=[];
for(const [name,rows]of buckets){
 const [E,profile,arm,policy]=name.split('|');if(arm==='base')continue;
 let gained=0,lost=0;
 for(const row of rows){const base=full.get([E,profile,policy,row.seed,'base'].join('|'));
  assert(base,'Missing paired baseline');if(!base.win&&row.win)gained++;if(base.win&&!row.win)lost++;}
 paired.push({E:Number(E),profile,arm,policy,n:rows.length,gained,lost});
}
const summary={phase:'C2.2',sourceSha:confirm.sourceSha,triage:{rows:triage.rows.length,computed:triage.computed,reused:triage.reused},
 confirm:{rows:confirm.rows.length,computed:confirm.computed,reused:confirm.reused},
 gates:{errors:0,timeouts:0,negativePairs,negativeDifferences,baselinePairs,baselineDifferences},groups,paired};
fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({triage:summary.triage,confirm:summary.confirm,gates:summary.gates,groups:groups.length,paired:paired.length,output}));
