// Bounded Phase 2: 200 combat trials, 5,000 production victory/reward samples.
// No balance patches, browser services or progression simulation.
const assert=require('node:assert/strict');
const {harness}=require('./simulate-v091.cjs');
const {plan,weapons}=require('./validate-v091-builds.cjs');
const c=harness(),a=c.inspect,combat=[],references={};let trialCount=0;
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0;};
function group(level,weapon,label,n,build){
 const sum={wins:0,hp:0,seconds:0,power:0,damageIn:0,damageOut:0,casts:0,fallbacks:0},eliteWins={tank:0,berserker:0,vampire:0,caster:0};let winSeconds=0;
 for(let i=0;i<n;i++){
  assert(++trialCount<=200,'combat budget');const elite=Object.keys(eliteWins)[i%4];
  const gearPlan=build(i),r=c.trial({level,weapon,seed:hash(920200+i),elite,gearPlan,diagnostics:true});
  assert(!r.timeout);for(const item of Object.values(r.equipment).filter(Boolean))assert(a.elementPool(item.slot,item.subtype).includes(item.effect));
  for(const k in sum)sum[k]+=k==='wins'?Number(r.win):r[k];
  if(r.win){winSeconds+=r.seconds;eliteWins[elite]++;}
  if(weapon==='Sword'&&label==='Epic-3'&&i===0)references[level]=r.equipment;
 }
 const result={level,weapon,label,n,winPct:100*sum.wins/n,winningSeconds:sum.wins?winSeconds/sum.wins:null,eliteWins};
 for(const k in sum)if(k!=='wins')result[k]=sum[k]/n;combat.push(result);
}
for(const level of [10,50,100])for(const weapon of weapons)group(level,weapon,'Epic-3',8,()=>plan(a,level,weapon,'epic-3'));
for(const points of [2,3,5])group(50,'Wand','Crystal-'+points,8,()=>{
 const specs=plan(a,50,'Wand','epic-3');let count=0;
 for(const item of specs)if(a.elementPool(item.slot,item.subtype).includes('crystal')&&count<points){item.effect='crystal';count++;}
 assert.equal(count,points);return specs;
});
// Same seeds and elites as the first four trials of the Epic reference; only main rarity differs.
for(const weapon of ['Sword','Staff'])group(50,weapon,'Legendary-main',4,()=>plan(a,50,weapon,'epic-3').map(x=>x.slot==='weapon'?{...x,rarity:'Legendary'}:x));
assert.equal(trialCount,200);
// Direct proc trace tests production setOnAttack, not a second combat implementation.
const crystal=[];
for(const pieces of [2,3,5]){
 const r={stats:{bonus:a.setBonuses({crystal:pieces}).values},enemy:{hp:10000,maxhp:10000,baseDef:0,def:0,barrier:0},hp:1000,maxhp:1000,barrier:0,setCooldowns:{},combatSeconds:0};
 const hits=[];
 for(let hit=1;hit<=15;hit++){r.combatSeconds=hit-1;hits.push(a.setOnAttack(r,100,false,false));}
 const expected=Array.from({length:15},(_,i)=>8+(pieces>=3&&(i+1)%3===0?15:0)+(pieces===5&&(i===2||i===14)?35:0));
 assert.deepEqual(hits,expected);crystal.push({pieces,bonusDamageByHit:hits});
 if(pieces===5){r.setTemp=null;for(let i=0;i<3;i++){r.combatSeconds=15+i;const extra=a.setOnAttack(r,100,false,false);if(i===2)assert.equal(extra,23,'Burst cooldown survives encounter reset');}}
}
const waves=[],identities={},subtypes={},allSubtypes={};let sampleCount=0,items=0,legends=0,upgrades=0,retainedUpgrades=0;
for(let wave=1;wave<=5;wave++){
 const row={wave,samples:0,items:0,legends:0,expectedItems:0,expectedLegends:0,powerUpgrades:0,retainedUpgrades:0};
 for(let i=0;i<1000;i++){
  assert(++sampleCount<=5000);const level=[10,50,100][i%3],cha=i%2?55:5,theme=a.THEMES[i%a.THEMES.length].id;
  const o=a.waveLootOdds(wave,cha),expected=o.drop+(wave===5?.35:0);row.expectedItems+=expected;row.expectedLegends+=expected*o.rarities.Legendary;
  const result=c.sampleRewards({level,wave,theme,cha,seed:hash(929000+wave*1000+i)});row.samples++;
  const gear=references[level];a.getState().equip=gear;const baseline=a.totalStats(gear,[],[]);
  for(const item of result.loot){
   row.items++;items++;allSubtypes[item.subtype]=(allSubtypes[item.subtype]||0)+1;
   if(item.rarity==='Legendary'){
    const entry=a.LEGENDARY_CATALOG.find(x=>x.id===item.legendaryId);assert(a.legendaryMatches(entry,item));
    row.legends++;legends++;identities[item.legendaryId]=(identities[item.legendaryId]||0)+1;subtypes[item.subtype]=(subtypes[item.subtype]||0)+1;
   }
   const slots=['ring1','ring2'].includes(item.slot)?['ring1','ring2']:[item.slot];let better=false,retained=false;
   for(const slot of slots){const eq=a.comparisonEquip(item,slot),s=a.totalStats(eq,[],[]);
    if(s.power>baseline.power*1.01){better=true;if(eq.weapon?.subtype==='Sword'&&eq.offhand?.subtype==='Shield'&&(s.counts.poison||0)>=3)retained=true;}}
   if(better){row.powerUpgrades++;upgrades++;}if(retained){row.retainedUpgrades++;retainedUpgrades++;}
  }
 }
 waves.push(row);
}
const unique=Object.keys(identities).length;
console.log(JSON.stringify({baseline:'87a1bb4',budgets:{combatTrials:trialCount,rewardSamples:sampleCount,maxGearOpportunities:6000},combat,crystal,loot:{waves,items,legends,identities,subtypes,allSubtypes,unique,duplicateCatalogDrops:legends-unique,upgrades,retainedUpgrades}},(k,v)=>typeof v==='number'&&!Number.isInteger(v)?+v.toFixed(3):v,2));
