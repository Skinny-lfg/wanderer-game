'use strict';
// Native replay of integrated runtime; no patches and no assistance in E10.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('./v013-natural-progression.cjs');
const D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs'),P=require('./v013-build-planner.cjs'),T=globalThis.WandererAutomaticTalents;
const hash=s=>crypto.createHash('sha256').update(JSON.stringify(s)).digest('hex');
function respec(s,profile){
 const weapon=s.state.equip.weapon?.subtype,reset=T.reset(s.state.automaticTalents);
 const physical=['decay-blood-spread','arcane-decay-infusion'].includes(profile);
 if(physical&&weapon!=='Sword'||!physical&&!['Wand','Staff'].includes(weapon))return null;
 const p=P.propose(T,reset,{primary:'arcane',secondary:'decay',secondAt:1,model:'two',mix:true,element:'arcane',weapons:[weapon],armor:physical?'Leather':'Cloth',milestones:['grave_bloom'],orderedMilestones:true,focus:'rot'});
 const purchased={...reset,nodes:p.expectedNodes,prepared:'grave_bloom'};
 if(!purchased.nodes.includes('grave_bloom')||!T.valid(purchased))return null;
 return {...s,talentSpent:purchased.nodes.length,state:{...s.state,automaticTalents:purchased}};
}
function replay(profile,mode,shard,inputs,out){
 if(![0,1].includes(shard)||!['historical','assisted','natural'].includes(mode))throw Error('Invalid replay');
 const files=fs.statSync(inputs).isDirectory()?fs.readdirSync(inputs).filter(f=>f.endsWith('.json')).map(f=>path.join(inputs,f)):[inputs];
 const captures=files.map(f=>JSON.parse(fs.readFileSync(f,'utf8'))).filter(f=>f.profileId===profile);
 if(!captures.length||captures.some(c=>c.phase!=='capture'||mode!=='historical'&&c.captureMode!==mode))throw Error('Wrong capture population');
 const acc=captures.flatMap(c=>c.accounts),actors=acc.filter(x=>x.snapshot).map(x=>{
  const s=respec(x.snapshot,profile);return s?{seed:x.seed,s,weapon:s.state.equip.weapon.subtype,offhand:s.state.equip.offhand?.subtype||null,points:s.talentSpent,nodes:s.state.automaticTalents.nodes,gear:hash(s.state.equip),xp:s.xp}:null;
 }).filter(Boolean).sort((a,b)=>a.seed-b.seed);
 if(new Set(actors.map(a=>a.seed)).size!==actors.length)throw Error('Duplicate independent accounts');
 const rows=[];
 for(let k=0;k<50&&actors.length;k++){
  const i=shard*50+k,a=actors[i%actors.length],seed=6430000+i*101;
  for(const size of [1,4,8,12]){
   const x=D.native(a.s,{id:'normal-'+size,type:'normal',realm:'blood',size},seed);
   if(!(x.won||x.died||x.timedOut)||x.peakVisibleEnemies>4)throw Error('Unresolved or overflow');
   rows.push({seed,actor:a.seed,size,won:!!x.won,timeout:!!x.timedOut,seconds:x.seconds,secondary:x.secondaryTargetDamage,dot:x.secondaryDotDamage,infusion:x.infusionHits,funded:x.fundedCasts,mana:x.manaSpent,effects:x.graveBloomMetrics||{},roster:hash(x.roster),gear:x.gearFingerprint,xp:x.talentXp});
  }
 }
 const result={stage:'6.47C',profile,mode,shard,source:S.sourceFingerprint().sha256,attemptedAccounts:acc.length,actors:actors.map(({s,...a})=>a),rows};
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));
 console.log('STAGE647C_SHARD='+JSON.stringify({profile,mode,shard,actors:result.actors.map(a=>({seed:a.seed,weapon:a.weapon,points:a.points})),groups:[1,4,8,12].map(size=>{const a=rows.filter(r=>r.size===size);return {size,n:a.length,wins:a.filter(r=>r.won).length,timeouts:a.filter(r=>r.timeout).length,rotDamage:a.reduce((n,r)=>n+(r.dot||0),0),blooms:a.reduce((n,r)=>n+(r.effects.graveBloomActivations||0),0)};})}));
}
if(require.main===module){const [profile,mode,shard,input,out]=process.argv.slice(2);replay(profile,mode,Number(shard),input,out);}
module.exports={replay,respec};
