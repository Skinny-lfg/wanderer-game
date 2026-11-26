'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),G=require('./v013-global-e10.cjs'),S=require('./simulate-progression.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
const IDS=G.IDS.filter(id=>/^(blood-|fury-|decay-cycle-)/.test(id)),ARMS=['pure','radiance','aegis'],N=50,POINTS=30,OFFENSIVE=22;
const SC=G.SC.filter(s=>['normal-1','normal-4','normal-8','normal-12','elite-tank','elite-gravecaller','boss-blood','boss-decay'].includes(s.id));
const SUPPORT={radiance:['affinity_radiance','strong_heart','renewal'],aegis:['affinity_aegis','guarded_block','barrier_pulse']};
function profile(id,arm){
 assert(IDS.includes(id)&&ARMS.includes(arm));const p=G.profile(id);if(arm==='pure')return p;
 // Retain the exact first 22 purchased nodes (including every declared
 // offensive identity skill). Swap only the last eight for a legal support path.
 const base=p.t.nodes.slice(0,OFFENSIVE),support=buy(SUPPORT[arm],{xp:POINTS*T.POINT_XP});
 assert.equal(support.nodes.length,POINTS-OFFENSIVE);
 let t={...p.t,nodes:[...base]};assert(T.valid(t));
 for(const id of support.nodes){const next=T.allocate(t,id);assert(next,'support allocation '+p.id+' '+arm+' '+id);t=next;}
 assert(T.valid(t));assert.equal(t.nodes.length,POINTS);
 assert.deepEqual(t.nodes.slice(0,OFFENSIVE),base);
 for(const skill of p.skills)assert(t.nodes.includes(skill),'lost offensive identity '+skill);
 assert.deepEqual(t.nodes.filter(id=>id.startsWith('affinity_')).sort(),['affinity_'+p.families[0],'affinity_'+arm].sort());
 assert(!t.nodes.includes('plagueheart'));
 return {...p,families:[p.families[0],arm],t};
}
function paired(a,b){
 for(const key of ['id','sc','kind','trial','seed','resolved','realm','gear','roster','roles','trait','condition','bossMods','elite','boss'])assert.deepEqual(b[key],a[key],'pair '+a.id+' '+a.sc+' '+a.trial+' '+key);
}
function cell(id,sc,i){const rows={};for(const arm of ARMS)rows[arm]=G.cell(profile(id,arm),sc,i);for(const arm of ARMS.slice(1))paired(rows.pure,rows[arm]);return {sc:sc.id,i,rows};}
function avg(rows,fn){return rows.length?rows.reduce((n,r)=>n+fn(r),0)/rows.length:null;}
function summarize(cases,arm){
 const rows=cases.map(x=>x.rows[arm]),base=cases.map(x=>x.rows.pure),s=G.summary(rows),dead=rows.filter(x=>x.died),lostBoth=cases.filter(x=>x.rows.pure.died&&x.rows[arm].died),rescued=cases.filter(x=>x.rows.pure.died&&x.rows[arm].won),lost=cases.filter(x=>x.rows.pure.won&&x.rows[arm].died);
 const won=rows.filter(x=>x.won);
 return {...s,meanDamage:avg(rows,x=>x.damage),meanTaken:avg(rows,x=>x.taken),meanAbsorbed:avg(rows,x=>x.absorbed),meanHealed:avg(rows,x=>x.healed),meanHP:avg(rows,x=>x.hpMax),meanDeathSeconds:avg(dead,x=>x.seconds),meanWinSeconds:avg(won,x=>x.seconds),bothDied:lostBoth.length,bothDiedBaseSeconds:avg(lostBoth,x=>x.rows.pure.seconds),bothDiedArmSeconds:avg(lostBoth,x=>x.rows[arm].seconds),bothDiedDeltaSeconds:avg(lostBoth,x=>x.rows[arm].seconds-x.rows.pure.seconds),bothDiedBaseDamage:avg(lostBoth,x=>x.rows.pure.damage),bothDiedArmDamage:avg(lostBoth,x=>x.rows[arm].damage),lossToWin:rescued.length,winToLoss:lost.length,deltaWinPct:100*(rows.filter(x=>x.won).length-base.filter(x=>x.won).length)/rows.length};
}
function group(cases){const groups={overall:cases,normal:cases.filter(x=>x.sc.startsWith('normal-')),elite:cases.filter(x=>x.sc.startsWith('elite-')),boss:cases.filter(x=>x.sc.startsWith('boss-')),...Object.fromEntries(SC.map(s=>[s.id,cases.filter(x=>x.sc===s.id)]))};return Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,Object.fromEntries(ARMS.map(a=>[a,summarize(v,a)]))]));}
function write(file,data){fs.mkdirSync(require('node:path').dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data));}
function run(id){assert(IDS.includes(id));const cases=[];for(const sc of SC)for(let i=0;i<N;i++)cases.push(cell(id,sc,i));const profiles=Object.fromEntries(ARMS.map(a=>[a,profile(id,a).t.nodes]));write('reports/survival-e10/'+id+'.json',{id,profiles,source:S.sourceFingerprint().sha256,cases});console.log('SURVIVAL_E10_SHARD='+JSON.stringify({id,n:cases.length*ARMS.length,overall:group(cases).overall}));}
function smoke(){for(const id of IDS){cell(id,SC[0],0);}for(const id of ['blood-daggers','fury-bow','decay-cycle-wand'])for(const sc of SC)cell(id,sc,1);console.log('SURVIVAL_E10_SMOKE='+JSON.stringify({profiles:IDS.length*ARMS.length,scenarios:SC.length,fights:(IDS.length+3*SC.length)*ARMS.length}));}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/survival-e10/'+id+'.json','utf8'));assert.equal(x.id,id);assert.equal(x.cases.length,N*SC.length);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,x.cases.length);for(const c of x.cases)for(const arm of ARMS.slice(1))paired(c.rows.pure,c.rows[arm]);return x;});assert.equal(new Set(all.map(x=>x.source)).size,1);
 const profiles=Object.fromEntries(all.map(x=>[x.id,{nodes:x.profiles,...group(x.cases)}]));
 const families=Object.fromEntries(['blood','fury','decay'].map(f=>[f,group(all.filter(x=>x.id.startsWith(f+'-')).flatMap(x=>x.cases))]));
 const cases=all.flatMap(x=>x.cases),overall=group(cases),report={n:cases.length*ARMS.length,pairedComparisons:cases.length*2,source:all[0].source,overall,families,profiles};
 write('reports/v013-survival-e10.json',report);
 const compact=s=>({n:s.n,wins:s.wins,winPct:+s.winPct.toFixed(2),timeouts:s.timeouts,dps:+s.meanDps.toFixed(2),damage:Math.round(s.meanDamage),def:+s.meanDefense.toFixed(2),hp:Math.round(s.meanHP),taken:+s.takenPerSecond.toFixed(2),absorbed:Math.round(s.meanAbsorbed),healed:Math.round(s.meanHealed),deathSec:s.meanDeathSeconds===null?null:+s.meanDeathSeconds.toFixed(2),bothDied:s.bothDied,bothDiedDelta:s.bothDiedDeltaSeconds===null?null:+s.bothDiedDeltaSeconds.toFixed(2),bothDiedBaseDamage:s.bothDiedBaseDamage===null?null:Math.round(s.bothDiedBaseDamage),bothDiedArmDamage:s.bothDiedArmDamage===null?null:Math.round(s.bothDiedArmDamage),rescued:s.lossToWin,lost:s.winToLoss});
 const brief=g=>Object.fromEntries(['overall','normal','elite','boss',...SC.map(x=>x.id)].map(k=>[k,Object.fromEntries(ARMS.map(a=>[a,compact(g[k][a])]))]));
 console.log('SURVIVAL_E10_OVERVIEW='+JSON.stringify({n:report.n,pairedComparisons:report.pairedComparisons,overall:brief(overall),families:Object.fromEntries(Object.entries(families).map(([k,v])=>[k,brief(v)]))}));
 for(const f of ['blood','fury','decay'])console.log('SURVIVAL_E10_'+f.toUpperCase()+'='+JSON.stringify(Object.fromEntries(Object.entries(profiles).filter(([k])=>k.startsWith(f+'-')).map(([k,v])=>[k,brief(v)]))));
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke')smoke();else if(cmd==='aggregate')aggregate();else throw Error('command');}
module.exports={profile,paired,cell,summarize,IDS,ARMS,SC};
