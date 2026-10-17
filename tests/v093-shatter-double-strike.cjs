// Production-only regression: v0.9.3 Shatter and main-hand Dagger Double Strike.
// All runs use an isolated VM; no browser storage, Firebase, or live saves.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {harness}=require('../scripts/simulate-v091.cjs');
const {caseList,trialOptions}=require('../scripts/v010-abilities-sim.cjs');
const html=fs.readFileSync('index.html','utf8');
const gates='const WANDERER_SHATTER_ENABLED=true,WANDERER_DOUBLE_STRIKE_ENABLED=true;';
const shatter="setDirectEnemyDamage(r,s.spellPower*.30,'❄️ Shatter!');";
const doubleStrike="setDirectEnemyDamage(r,Math.max(1,Math.round(base*.55)),'🗡 Double Strike!');";
for(const needle of [gates,shatter,doubleStrike])assert.equal(html.split(needle).length-1,1,'Unique production anchor: '+needle);
function simulation(shatterEnabled,doubleEnabled){
 return harness('index.html',{legendary:true,transform:source=>{
  source=source.replace(gates,'const WANDERER_SHATTER_ENABLED='+shatterEnabled+',WANDERER_DOUBLE_STRIKE_ENABLED='+doubleEnabled+';');
  source=source.replace(shatter,"r.protoMetrics=r.protoMetrics||{};r.protoMetrics.shatterProcs=(r.protoMetrics.shatterProcs||0)+1;"+shatter);
  source=source.replace(doubleStrike,"r.protoMetrics=r.protoMetrics||{};r.protoMetrics.doubleStrikes=(r.protoMetrics.doubleStrikes||0)+1;"+doubleStrike);
  return source;
 }});
}
const current=simulation(true,true),withoutShatter=simulation(false,true),withoutDouble=simulation(true,false),previous=simulation(false,false);
function paired(type,level,n,off,key){
 const samples=caseList(current,type,level),counts={with:0,without:0,attacks:0,casts:0,winCurrent:0,winOld:0};
 for(let i=0;i<n;i++){
  const opts=trialOptions(samples[i%samples.length].s,level,i);
  const on=current.trial(opts),old=off.trial(opts);
  assert.equal(on.timeout,false);assert.equal(old.timeout,false);
  counts.with+=on.protoMetrics[key]||0;
  counts.without+=old.protoMetrics[key]||0;
  counts.attacks+=on.attacks;counts.casts+=on.casts;
  counts.winCurrent+=Number(on.win);counts.winOld+=Number(old.win);
  assert((on.protoMetrics.doubleStrikes||0)<=on.attacks,'At most one Double Strike per main attack');
  assert((on.protoMetrics.shatterProcs||0)<=on.casts,'Shatter requires a funded cast');
 }
 assert(counts.with>0,type+' skill never triggered at D'+level);
 assert.equal(counts.without,0,type+' skill still triggered while disabled');
 return {type,level,n,...counts};
}
const rows=[
 paired('Frost',40,48,withoutShatter,'shatterProcs'),
 paired('Frost',100,48,withoutShatter,'shatterProcs'),
 paired('Daggers',40,48,withoutDouble,'doubleStrikes'),
 paired('Daggers',100,48,withoutDouble,'doubleStrikes')
];
const unaffected={level:40,weapon:'Two-Handed',affinity:'bleed',rarity:'Rare',seed:17641,theme:'temple',elite:'tank'};
const baseline=current.trial(unaffected),control=previous.trial(unaffected);
for(const key of ['win','hp','seconds','damageIn','damageOut','gold','fragments','loot'])assert.equal(baseline[key],control[key],'Unrelated Two-Handed combat changed: '+key);
const sample=caseList(current,'Daggers',40)[0].s,options=trialOptions(sample,40,23);
const normal=current.trial({...options,speed:1}),fast=current.trial({...options,speed:4});
for(const key of ['win','hp','seconds','damageIn','damageOut','gold','fragments','loot'])assert.equal(normal[key],fast[key],'1x/4x gameplay mismatch: '+key);
assert.match(html,/Shatter: after three successful mana-funded Frost spell hits/);
assert.match(html,/Double Strike: 25% chance after a damaging main-hand strike/);
console.log('PASS: Production Shatter/Double Strike A/B, no unrelated 2H changes, stable 1x/4x.',JSON.stringify(rows));
