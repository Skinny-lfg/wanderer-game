'use strict';
// B3.1D extension: isolate equipment AP from approved hit coefficients.
// All variants use native gear, with a test-only adjustment to the weapon atk affix.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),B=require('./v013-b31b-twohand-compensation.cjs'),C=require('./v013-b31c-compensation-validation.cjs');
const OUT='reports/b31d-physical-stack',N=20,SEED=101700001,SC=A.scenarios.filter(x=>['solo','group12','boss'].includes(x.id)),GEAR=fs.readFileSync('combat/v012-gear-stats.js','utf8');
const specs=C.physical;
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source anchor '+a);return s.replace(a,b);}
function arms(st){const a=(id,legacy,atk)=>({id,legacy,atk,loadout:[id,st.weapon,null]});return [a('approved',false,1),a('approved+atk125',false,1.25),a('approved+atk150',false,1.5),a('oldMultiplier',true,1),a('oldMultiplier+atk150',true,1.5),{id:st.ref[0][0],legacy:false,atk:1,reference:true,loadout:st.ref[0]}];}
function sources(st,a){
 // B.sources at the original base argument performs no coefficient replacement;
 // it reads the currently approved runtime and adds passive hit counters.
 const src=B.sources(st.weapon,{factor:B.configs[st.weapon].base,reference:!!a.reference});
 if(a.legacy){
  const key=st.weapon==='Bow'?'Bow':'Two-Handed',now=key==='Bow'?'1.40':'2.10',old=key==='Bow'?'1.08':'1.70',map=key==='Bow'?'Bow:':"'Two-Handed':";
  src.runtime=replace(src.runtime,"kind==='"+key+"'?"+now+":","kind==='"+key+"'?"+old+":");
  src.runtime=replace(src.runtime,map+now+",",map+old+",");
  src.buildcraft=replace(src.buildcraft,map+now+",",map+old+",");
 }
 // Only raw attack affix on physical two-hand weapons. Do not change
 // primary attributes, other slots, attack speed, defense, or item rarity.
 const gear=a.atk===1?GEAR:replace(GEAR,'s[dest]+=itemStatValue(item,key)*factor;', "s[dest]+=itemStatValue(item,key)*factor*(slot==='weapon'&&['Bow','Two-Handed'].includes(item.subtype)&&key==='atk'?"+a.atk+":1);");
 return {...src,gearSource:gear};
}
function cell(st,sc,i,a){
 const src=sources(st,a),row=A.cell(st,sc,i,a.loadout,null,{id:a.id,seedBase:SEED,...src});
 assert.equal(row.weapon,a.loadout[1]);assert.equal(row.off,a.loadout[2]);assert.equal([row.won,row.died,row.timeout,row.surrendered].filter(Boolean).length,1);assert(row.directActual<=row.directRaw+1e-6&&row.directActual<=row.damage+1e-6);
 return {...row,legacy:!!a.legacy,atk:a.atk,reference:!!a.reference,runtimeHash:hash(src.runtime),buildcraftHash:hash(src.buildcraft),gearSourceHash:hash(src.gearSource)};
}
function otherStats(s){return Object.fromEntries(Object.entries(s).filter(([k])=>!['attack','power'].includes(k)));}
function pair(st,sc,i){
 const rows=arms(st).map(a=>cell(st,sc,i,a)),base=rows[0];
 for(const r of rows){
  assert.equal(r.resolved,base.resolved);assert.equal(r.rosterHash,base.rosterHash);assert.equal(r.nonHands,base.nonHands);assert.deepEqual(r.nodes,base.nodes);
  if(!r.reference){assert.equal(r.gearHash,base.gearHash);assert.deepEqual(otherStats(r.stats),otherStats(base.stats));if(r.atk===1)assert.deepEqual(r.stats,base.stats);else assert(r.stats.attack>=base.stats.attack);}
 }
 return {seed:base.seed,rows};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function run(si,ci){
 const st=specs[si],sc=SC[ci];assert(st&&sc);const cases=Array.from({length:N},(_,i)=>pair(st,sc,i));write('study-'+si+'-'+ci,{si,ci,study:st.id,scenario:sc.id,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,cases});
}
function smoke(){
 for(const st of specs){
  const x=pair(st,SC[0],0),base=x.rows[0],candidate=x.rows[2];assert(candidate.stats.attack>base.stats.attack,'Missing AP increase '+st.id);
  assert.notEqual(candidate.gearSourceHash,base.gearSourceHash);assert.notEqual(x.rows[3].runtimeHash,base.runtimeHash);assert.notEqual(x.rows[3].buildcraftHash,base.buildcraftHash);
  pair(st,SC[1],1);
 }
 console.log('B31D_STACK_SMOKE='+JSON.stringify({profiles:specs.length,arms:6,approvedBaseline:true,statsIsolated:true}));
}
function aggregate(){
 const xs=specs.flatMap((st,si)=>SC.map((sc,ci)=>JSON.parse(fs.readFileSync(OUT+'/study-'+si+'-'+ci+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 for(const x of xs){const st=specs[x.si],ids=arms(st).map(a=>a.id);assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,N);assert.equal(new Set(x.cases.map(c=>c.seed)).size,N);for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),ids);
  const by=Object.fromEntries(ids.map(id=>[id,{...B.metrics(x.cases.map(c=>c.rows.find(r=>r.id===id))),paired:A.paired(x.cases,'approved',id),vsReference:A.paired(x.cases,ids.at(-1),id)}]));
  for(const a of Object.values(by))assert.equal(a.wins+a.deaths+a.surrenders+a.timeout,a.n);
  const interaction={DPS:by['approved+atk150'].DPS-by.approved.DPS-by['oldMultiplier+atk150'].DPS+by.oldMultiplier.DPS,winPct:by['approved+atk150'].winPctAll-by.approved.winPctAll-by['oldMultiplier+atk150'].winPctAll+by.oldMultiplier.winPctAll};
  const row={study:x.study,scenario:x.scenario,arms:by,interaction};results.push(row);
  console.log('B31D_STACK='+JSON.stringify({study:x.study,scenario:x.scenario,arms:Object.fromEntries(Object.entries(by).map(([id,v])=>[id,{n:v.n,wins:v.wins,timeout:v.timeout,AP:v.AP,DPS:v.DPS,basePerMainHit:v.basePerMainHit,effectiveMainHit:v.effectiveMainHit,secondaryDPS:v.secondaryDPS,secondaryDotDPS:v.secondaryDotDPS,takenPerSec:v.takenPerSec,paired:v.paired,vsReference:v.vsReference}])),interaction}));
 }
 assert.equal(all.length,4320);const summary={commit:process.env.GITHUB_SHA,native:xs[0].native,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,results,scope:'20-seed screening; 12 fixed legal E10 Rare panels. Approved physical coefficients remain baseline. Old multiplier arm retains approved Bow full secondary status to isolate hit coefficient. Item ATK-only test VM; no production tuning or natural balance claim.'};write('summary',summary);console.log('B31D_STACK_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
if(require.main===module){const [cmd,si,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(si),Number(ci));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
