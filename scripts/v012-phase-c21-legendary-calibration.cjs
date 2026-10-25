// C.2.1 audit only: counterfactual Veil / Heartroot coefficients in VM.
// No production code changes, no real saves, no Firebase, no loot changes.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {run}=require('./v012-affinity-combat-sim.cjs');
const nativePath='combat/v012-combat-runtime.js';
const native=fs.readFileSync(path.resolve(__dirname,'../'+nativePath),'utf8');
function replaceOnce(src,needle,value){
  const count=src.split(needle).length-1;
  if(count!==1)throw Error('C2.1 source invariant mismatch ('+count+'): '+needle);
  return src.replace(needle,value);
}
function calibrated(veil,heartroot){
  let src=native;
  if(veil){
    // Empowered (Aegis) / ordinary: Barrier 6/4 -> 4/2.5% MaxHP;
    // offensive followup 45/30 -> 30/20% base damage.
    src=replaceOnce(src,"ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04","ports.legendaryEmpowered(r,'veil-thousand-seals')?.04:.025");
    src=replaceOnce(src,"ports.legendaryEmpowered(r,'veil-thousand-seals')?.45:.30","ports.legendaryEmpowered(r,'veil-thousand-seals')?.30:.20");
  }
  if(heartroot){
    // Empowered (Vitality) / ordinary: healing 0.45/0.30 -> 0.30/0.20% HP/s;
    // realm cap 15 -> 10% MaxHP.
    src=replaceOnce(src,"ports.legendaryEmpowered(r,'heartroot-carapace')?.0045:.003","ports.legendaryEmpowered(r,'heartroot-carapace')?.003:.002");
    src=replaceOnce(src,"r.maxhp*.15-(t.heartrootHealed||0)","r.maxhp*.10-(t.heartrootHealed||0)");
  }
  return src;
}
const arms={
  base:{veil:false,heartroot:false},
  veil:{veil:true,heartroot:false},
  heartroot:{veil:false,heartroot:true},
  both:{veil:true,heartroot:true}
};
const sources=Object.fromEntries(Object.entries(arms).map(([k,v])=>[k,calibrated(v.veil,v.heartroot)]));
const builds=[
 {name:'Cloth Staff',weapon:'Staff',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],
   singles:[{belt:'veil-thousand-seals'},{armor:'heartroot-carapace'}],
   pairs:[{belt:'veil-thousand-seals',armor:'heartroot-carapace'}]},
 {name:'Cloth Wand + Orb',weapon:'Wand',offhandType:'Orb',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],
   singles:[{belt:'veil-thousand-seals'},{armor:'heartroot-carapace'}],
   pairs:[{weapon:'voidglass',belt:'veil-thousand-seals'},{belt:'veil-thousand-seals',armor:'heartroot-carapace'}]},
 {name:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],
   singles:[{belt:'veil-thousand-seals'},{armor:'heartroot-carapace'}],
   pairs:[{offhand:'oathwall',belt:'veil-thousand-seals'},{weapon:'verdant-oath',belt:'veil-thousand-seals'}]},
 {name:'Plate Mace + Shield',weapon:'Mace',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],
   singles:[{belt:'veil-thousand-seals'},{armor:'heartroot-carapace'}],
   pairs:[{offhand:'oathwall',armor:'heartroot-carapace'}]},
 {name:'Leather Dual Daggers',weapon:'Daggers',offhandType:'Daggers',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],
   singles:[{belt:'veil-thousand-seals'},{armor:'heartroot-carapace'}],
   pairs:[{armor:'heartroot-carapace',amulet:'chalice-hollow-king'}]},
 {name:'Leather Bow',weapon:'Bow',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],
   singles:[{belt:'veil-thousand-seals'},{armor:'heartroot-carapace'}],
   pairs:[{belt:'veil-thousand-seals',armor:'heartroot-carapace'}]},
 {name:'Leather Two-Handed',weapon:'Two-Handed',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],
   singles:[{belt:'veil-thousand-seals'},{armor:'heartroot-carapace'}],
   pairs:[{belt:'veil-thousand-seals',armor:'heartroot-carapace'},{weapon:'gravewake',ring1:'eye-of-morrow'}]}
];
const variants=[];
for(const b of builds){
  variants.push({build:b,profile:'none',items:null,arms:['base']});
  for(const item of b.singles){
    const id=Object.values(item)[0],isVeil=id==='veil-thousand-seals';
    variants.push({build:b,profile:id,items:item,arms:['base',isVeil?'veil':'heartroot']});
  }
  for(const item of b.pairs){
    const ids=Object.values(item),veil=ids.includes('veil-thousand-seals'),heartroot=ids.includes('heartroot-carapace');
    variants.push({build:b,profile:ids.join('+'),items:item,arms:veil&&heartroot?['base','veil','heartroot','both']:['base',veil?'veil':heartroot?'heartroot':'both']});
  }
}
const levels=[50,100,200],policies=['triple','random'],seeds=Number(process.env.C21_SEEDS||64);
if(!Number.isInteger(seeds)||seeds<1||seeds>256)throw Error('Invalid C21_SEEDS');
const output=process.argv[2]||'/tmp/wanderer-phase-c21-results.json';
const rows=[],errors=[];
const counts=variants.reduce((n,v)=>n+v.arms.length,0)*levels.length*policies.length*seeds;
let index=0;
function save(complete){fs.writeFileSync(output,JSON.stringify({phase:'C2.1',complete,seeds,levels,policies,arms,rows})+'\n');}
for(const E of levels)for(const b of builds)for(const policy of policies)for(let seed=0;seed<seeds;seed++){
 for(const variant of variants.filter(v=>v.build===b)){
  if(variant.items&&Object.keys(variant.items).length>2)throw Error('More than 2 Legendary items');
  for(const arm of variant.arms){
   const ids=variant.items?Object.values(variant.items):[];
   if((arm==='veil'&&!ids.includes('veil-thousand-seals'))||(arm==='heartroot'&&!ids.includes('heartroot-carapace')))throw Error('Unexpected arm/profile mismatch');
   try{
    const r=run({E,weapon:b.weapon,rarity:'Epic',armorType:b.armorType,offhandType:b.offhandType,
     family:b.family,targetFamilies:b.targetFamilies,strategy:policy,routeMode:'planned',runes:true,
     seed:20261021+seed,controlSeed:822000+seed*17+E,
     legendaryItems:variant.items,moduleOverrides:{[nativePath]:sources[arm]}});
    const row={E,build:b.name,policy,seed,profile:variant.profile,arm,ids,win:!!r.win,reached:r.reached,
     dps:r.dps,heal:r.healPerSecond,barrier:r.barrierPerSecond,ehp:r.observedEhpBudget,
     received:r.damageReceived,procs:r.legendaryProcCounts,error:r.error,timeout:!!r.timeout};
    rows.push(row);
    if(r.error||r.timeout)errors.push(row);
   }catch(e){
    const row={E,build:b.name,policy,seed,profile:variant.profile,arm,ids,error:String(e?.stack||e)};
    rows.push(row);errors.push(row);
   }
   index++;
  }
 }
 if(index%500===0)process.stderr.write('C21 '+index+'/'+counts+'\n');
 if(index%2000===0)save(false);
}
save(true);
const average=(arr,k)=>arr.reduce((n,x)=>n+Number(x[k]||0),0)/Math.max(1,arr.length);
const rounded=x=>Math.round(x*100)/100;
const summaries=[];
for(const E of levels)for(const v of variants){
 for(const arm of v.arms){
  const rr=rows.filter(r=>r.E===E&&r.build===v.build.name&&r.profile===v.profile&&r.arm===arm);
  summaries.push({E,build:v.build.name,profile:v.profile,arm,n:rr.length,wins:rr.filter(r=>r.win).length,
   realm:rounded(average(rr,'reached')),dps:rounded(average(rr,'dps')),heal:rounded(average(rr,'heal')),
   barrier:rounded(average(rr,'barrier')),ehp:rounded(average(rr,'ehp'))});
 }
}
const paired=[];
for(const E of levels)for(const v of variants)for(const arm of v.arms.filter(a=>a!=='base')){
 const baseline=rows.filter(r=>r.E===E&&r.build===v.build.name&&r.profile===v.profile&&r.arm==='base');
 const modified=new Map(rows.filter(r=>r.E===E&&r.build===v.build.name&&r.profile===v.profile&&r.arm===arm)
  .map(r=>[r.policy+'|'+r.seed,r]));
 let gained=0,lost=0,equal=0;
 for(const r of baseline){const m=modified.get(r.policy+'|'+r.seed);if(!m){errors.push({missing:r,arm});continue;}
  if(!r.win&&m.win)gained++;else if(r.win&&!m.win)lost++;else equal++;
 }
 paired.push({E,build:v.build.name,profile:v.profile,arm,gained,lost,equal});
}
for(const s of summaries)console.log('C21_SUMMARY '+JSON.stringify(s));
for(const p of paired)console.log('C21_PAIRED '+JSON.stringify(p));
console.log('C21_TOTAL '+JSON.stringify({runs:rows.length,expected:counts,errors:errors.length,seeds,builds:builds.length,profiles:variants.length,arms}));
if(rows.length!==counts||errors.length){console.error('C21_ERRORS '+JSON.stringify(errors.slice(0,5)));process.exitCode=1;}
