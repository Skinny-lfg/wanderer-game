// Paired A/B on inventories earned in persistent production progression.
const fs=require('node:fs');
const {harnessFor,TARGETS}=require('./v010-progression.cjs');
const {variants}=require('./v010-balance-ab.cjs');
const {harness}=require('./simulate-v091.cjs');
const players=require('../docs/v010-progression-baseline.json').players;
const scenarios={
 Bow:['bowBarrier8','bowBarrier10','bowBarrier12'],
 'Two-Handed':['heavyFactor185','heavyFactor19','heavyFactor20'],
 Frost:['frost40','frost50','frost60'],
 Staff:['staffCost11','staffGuard8'],
 Fire:['fireHit15','fire21'],
 Daggers:['daggerBarrier3','daggerBarrier5']
};
const themes=['temple','ash','frost','drowned'],elites=['tank','berserker','vampire','caster'];
const ctx={baseline:harnessFor('baseline')};for(const names of Object.values(scenarios))for(const name of names)ctx[name]=harnessFor(name);
function matches(type,s,c){
 const weapon=s.equip.weapon;
 if(type==='Frost')return c.inspect.setCounts(s.equip).slow>=2;
 if(type==='Fire')return weapon?.effect==='burn'||c.inspect.setCounts(s.equip).burn>=2;
 return weapon?.subtype===type;
}
function report(){const rows=[];let trials=0;
 for(const level of TARGETS){
  const acquired=players.map(p=>({p,s:p.snapshots[level]})).filter(x=>x.s);
  for(const [type,names] of Object.entries(scenarios)){
   const examples=acquired.filter(x=>matches(type,x.s,ctx.baseline));
   if(!examples.length){rows.push({level,type,inventoryCount:0,reason:'No eligible acquired inventory at this milestone'});continue;}
   const results=[];
   for(const name of ['baseline',...names]){
    const sum={wins:0,hp:0,seconds:0,damageIn:0,damageOut:0,healing:0,barrierGained:0};let n=0;
    for(let j=0;j<examples.length;j++)for(let k=0;k<8;k++){
     const {p,s}=examples[j],seed=(Math.imul(p.seed+level*1009+j*13+k*97,2654435761)>>>0);
     const r=ctx[name].trial({level,weapon:s.equip.weapon?.subtype,equipment:s.equip,runes:s.runes,runeSlots:s.runeSlots,seed,theme:themes[k%4],elite:elites[Math.floor(k/2)%4]});
     if(r.timeout)throw Error('Combat timeout '+name+' '+level);
     n++;trials++;sum.wins+=+r.win;sum.hp+=r.hp;sum.seconds+=r.seconds;sum.damageIn+=r.damageIn;sum.damageOut+=r.damageOut;sum.healing+=r.healing;sum.barrierGained+=r.barrierGained;
    }
    results.push({variant:name,n,...Object.fromEntries(Object.entries(sum).map(([key,value])=>[key,+(value/n).toFixed(2)]))});
   }
   rows.push({level,type,inventoryCount:examples.length,results});
  }
 }
 return {method:'Actual earned gear and runes at each milestone; 8 matched seeds per inventory; four themes/four elite types; production combat in Node VM',trials,rows};
}
if(require.main===module){const out=report();fs.writeFileSync('docs/v010-final-ab-results.json',JSON.stringify(out)+'\n');console.log('Trials',out.trials,'groups',out.rows.length);}
module.exports={report};
