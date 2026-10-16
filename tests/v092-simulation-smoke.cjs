// Phase 1 only: eight expeditions at D1/D10; analytical probability checks, no Monte Carlo.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {harness}=require('../scripts/simulate-v091.cjs');
const {plan}=require('../scripts/validate-v091-builds.cjs');
const c=harness(),a=c.inspect;
const normalized=r=>JSON.parse(JSON.stringify({...r,equipment:Object.fromEntries(Object.entries(r.equipment).map(([slot,item])=>[slot,item?{...item,id:undefined,obtainedAt:undefined}:null]))}));
for(const [level,weapon]of [[1,'Sword'],[10,'Staff'],[10,'Two-Handed'],[10,'Wand']]){
 const gearPlan=plan(a,level,weapon,'epic-3');
 if(weapon==='Wand')for(const item of gearPlan)if(['armor','helm','amulet'].includes(item.slot))item.effect='crystal';
 const opts={level,weapon,gearPlan,seed:9201,diagnostics:true};
 const first=c.trial(opts),second=c.trial(opts);
 assert.deepEqual(normalized(first),normalized(second));
 assert(!first.timeout);assert(first.encounters.length>0);
 for(const field of ['hp','seconds','damageIn','damageOut','gold','fragments'])assert(Number.isFinite(first[field])&&first[field]>=0);
 for(const item of Object.values(first.equipment).filter(Boolean))assert(a.elementPool(item.slot,item.subtype).includes(item.effect));
 if(weapon==='Wand')assert.equal(first.counts.crystal,3);
}
const distribution=odds=>{assert(Object.values(odds).every(p=>p>=0&&p<=1));assert(Math.abs(Object.values(odds).reduce((s,p)=>s+p,0)-1)<1e-10);};
for(const wave of [1,2,3,4,5])for(const cha of [5,55,105]){const o=a.waveLootOdds(wave,cha);distribution(o.rarities);assert(o.drop>=0&&o.drop<=1);}
for(const craft of [false,true])distribution(a.rarityOdds(10,craft));
assert.equal(a.rarityOdds(10,true).Legendary,0);
assert(Math.abs(a.dungeonEquipmentOdds({id:'temple'}).reduce((s,x)=>s+x.prob,0)-1)<1e-10);
assert.equal(a.wavesForDungeon(9),4);assert.equal(a.wavesForDungeon(10),5);
assert(a.estimateEnemy(10,4).hp>a.estimateEnemy(10,1).hp);
assert.equal(a.LEGENDARY_CATALOG.length,21);
for(const entry of a.LEGENDARY_CATALOG){
 const slot=entry.slot==='ring'?'ring1':entry.slot;
 const item=a.makeItem(10,slot,null,'loot',entry.subtype,'Legendary');
 const identity=a.LEGENDARY_CATALOG.find(x=>x.id===item.legendaryId);
 assert(a.legendaryMatches(identity,item)); // Multiple valid identities per subtype are intentional.
 assert.equal(item.rarity,'Legendary');
}
const crystal=a.setBonuses({crystal:5}).values;
assert.equal(crystal.crystalBonus,.08);assert(crystal.crystalCharge&&crystal.crystalBurst);
const forged=a.makeItem(10,'weapon',null,'forge','Sword','Rare');
assert(a.saleFragments(forged)<=Math.floor(a.craftCost(10)*.25));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wanderer-phase1-'));
try{const file=path.join(dir,'changed.html');fs.writeFileSync(file,'<script>throw Error("must not execute")</script>');assert.throws(()=>harness(file),/bootstrap changed/);}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('PASS v0.9.2 Phase 1: 8 deterministic D1/D10 expeditions; legal gear, Crystal, loot distributions, Legendary mappings, Forge cap, bootstrap guard');
